import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  personalOrganizationName,
  personalOrganizationSlug,
  slugifyHandle,
} from "@/lib/auth/identity-helpers";
import { writeAuditLog } from "@/lib/audit/write";
import { AppError } from "@/lib/api/response";
import { isServiceRoleConfigured } from "@/lib/validation/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import {
  allocateClientPublicId,
  allocateOrganizationPublicId,
  allocateWorkerPublicId,
} from "@/lib/public-id/generator";
import { safeEmitDomainNotification } from "@/features/notifications/services/safe-emit";
import { BRAND } from "@/constants/brand";
import type { NotificationChannel } from "@/constants/notification";

export type ProvisionInput = {
  authSubject: string;
  email: string;
  displayName: string;
  emailVerified?: boolean;
  ip?: string | null;
  /** When true, Prisma user/profile ids match auth.users.id (PIN signup). */
  useAuthSubjectAsId?: boolean;
  skipWelcome?: boolean;
  participation?: "worker" | "client" | "both";
  roleKeys?: string[];
};

export async function emitAuthWelcome(params: {
  userId: string;
  organizationId: string;
  email: string;
  displayName: string;
  channels?: NotificationChannel[];
  dispatchNow?: boolean;
}): Promise<void> {
  await safeEmitDomainNotification({
    event: "auth.welcome",
    organizationId: params.organizationId,
    actorUserId: params.userId,
    recipients: [
      {
        role: "client",
        userId: params.userId,
        email: params.email.toLowerCase(),
        displayName: params.displayName.trim() || "there",
      },
    ],
    variables: {
      recipientName: params.displayName.trim() || "there",
      organizationName: BRAND.name,
      publicRef: params.userId,
    },
    idempotencyKey: `auth.welcome:${params.userId}`,
    channels: params.channels ?? ["email", "sms", "in_app"],
    dispatchNow: params.dispatchNow ?? false,
    span: "auth.provision",
  });
}

async function uniqueHandle(base: string): Promise<string> {
  let candidate = slugifyHandle(base);
  for (let i = 0; i < 20; i += 1) {
    const existing = await prisma.profile.findUnique({
      where: { handle: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${slugifyHandle(base).slice(0, 20)}-${i + 1}`;
  }
  return `${slugifyHandle(base)}-${Date.now().toString(36)}`;
}

/**
 * Idempotent first-login / signup provisioning.
 * Creates user, profile, personal org, owner membership, default roles.
 */
export async function provisionAuthenticatedUser(
  input: ProvisionInput,
): Promise<{ userId: string; organizationId: string }> {
  const existing = await prisma.user.findUnique({
    where: { authSubject: input.authSubject },
    select: {
      id: true,
      activeOrganizationId: true,
      profile: { select: { id: true } },
    },
  });

  if (existing?.profile && existing.activeOrganizationId) {
    return {
      userId: existing.id,
      organizationId: existing.activeOrganizationId,
    };
  }

  if (existing && !existing.profile) {
    throw new AppError(
      "USER_INCOMPLETE",
      "User record exists without a profile — contact support",
      500,
    );
  }

  const handle = await uniqueHandle(
    input.displayName || input.email.split("@")[0] || "user",
  );

  const requestedRoleKeys = input.roleKeys?.length
    ? input.roleKeys
    : ["worker", "client"];
  const roles = await prisma.role.findMany({
    where: { key: { in: requestedRoleKeys } },
  });
  if (roles.length !== requestedRoleKeys.length) {
    throw new AppError(
      "ROLES_NOT_SEEDED",
      "Platform roles are not seeded. Run npm run db:seed",
      503,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const [workerPublicId, clientPublicId, organizationPublicId] =
      await Promise.all([
        allocateWorkerPublicId(tx),
        allocateClientPublicId(tx),
        allocateOrganizationPublicId(tx),
      ]);

    const userId = input.useAuthSubjectAsId ? input.authSubject : undefined;
    const user = await tx.user.create({
      data: {
        ...(userId ? { id: userId } : {}),
        authSubject: input.authSubject,
        email: input.email.toLowerCase(),
        emailVerifiedAt: input.emailVerified ? new Date() : null,
        accountType: "individual",
        participation: input.participation ?? "both",
        profile: {
          create: {
            ...(userId ? { id: userId } : {}),
            displayName: input.displayName.trim(),
            handle,
            workerPublicId,
            clientPublicId,
          },
        },
        roles: {
          create: roles.map((role) => ({ roleId: role.id })),
        },
      },
    });

    const org = await tx.organization.create({
      data: {
        publicId: organizationPublicId,
        name: personalOrganizationName(input.displayName),
        slug: personalOrganizationSlug(user.id),
        kind: "personal",
        ownerUserId: user.id,
        billingEmail: input.email.toLowerCase(),
        members: {
          create: {
            userId: user.id,
            orgRole: "owner",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { activeOrganizationId: org.id },
    });

    return { userId: user.id, organizationId: org.id };
  });

  await writeAuditLog({
    actorUserId: result.userId,
    action: "user.registered",
    resourceType: "user",
    resourceId: result.userId,
    organizationId: result.organizationId,
    ip: input.ip,
    metadata: { authSubject: input.authSubject },
  });

  if (!input.skipWelcome) {
    await emitAuthWelcome({
      userId: result.userId,
      organizationId: result.organizationId,
      email: input.email,
      displayName: input.displayName,
    });
  }

  if (isServiceRoleConfigured()) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.auth.admin.updateUserById(input.authSubject, {
        app_metadata: {
          platform_user_id: result.userId,
          roles: requestedRoleKeys,
          active_organization_id: result.organizationId,
        },
      });
    } catch (error) {
      logger.warn("Failed to sync Supabase app_metadata", {
        span: "auth.provision",
        err:
          error instanceof Error
            ? { name: error.name, message: error.message }
            : { message: String(error) },
      });
    }
  }

  return result;
}
