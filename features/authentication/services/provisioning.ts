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

export type ProvisionInput = {
  authSubject: string;
  email: string;
  displayName: string;
  emailVerified?: boolean;
  ip?: string | null;
};

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

  const workerRole = await prisma.role.findUnique({ where: { key: "worker" } });
  const clientRole = await prisma.role.findUnique({ where: { key: "client" } });

  if (!workerRole || !clientRole) {
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

    const user = await tx.user.create({
      data: {
        authSubject: input.authSubject,
        email: input.email.toLowerCase(),
        emailVerifiedAt: input.emailVerified ? new Date() : null,
        accountType: "individual",
        participation: "both",
        profile: {
          create: {
            displayName: input.displayName.trim(),
            handle,
            workerPublicId,
            clientPublicId,
          },
        },
        roles: {
          create: [
            { roleId: workerRole.id },
            { roleId: clientRole.id },
          ],
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

  await safeEmitDomainNotification({
    event: "auth.welcome",
    organizationId: result.organizationId,
    actorUserId: result.userId,
    recipients: [
      {
        role: "client",
        userId: result.userId,
        email: input.email.toLowerCase(),
        displayName: input.displayName.trim(),
      },
    ],
    variables: {
      recipientName: input.displayName.trim() || "there",
      organizationName: "Zolanzo",
      publicRef: result.userId,
    },
    idempotencyKey: `auth.welcome:${result.userId}`,
    channels: ["email", "sms", "in_app"],
    span: "auth.provision",
  });

  if (isServiceRoleConfigured()) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.auth.admin.updateUserById(input.authSubject, {
        app_metadata: {
          platform_user_id: result.userId,
          roles: ["worker", "client"],
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
