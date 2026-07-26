import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { writeAuditLog } from "@/lib/audit/write";
import {
  generateOpaqueToken,
  personalOrganizationName,
  sha256Hex,
  slugifyHandle,
} from "@/lib/auth/identity-helpers";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/route-policy";
import { assertCanInOrg } from "@/lib/rbac/access";
import type { OrgRole } from "@/constants/org-roles";
import { getEnv, isServiceRoleConfigured } from "@/lib/validation/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/observability/logger";
import { allocateOrganizationPublicId } from "@/lib/public-id/generator";

export type InviteResult = {
  invitationId: string;
  inviteUrl: string;
};

async function setActiveOrgCookie(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function switchActiveOrganization(params: {
  userId: string;
  organizationId: string;
  authSubject?: string;
}): Promise<ApiResponse<{ organizationId: string }>> {
  try {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: params.userId,
        organizationId: params.organizationId,
        status: "active",
      },
    });

    if (!membership) {
      throw new AppError(
        "NOT_A_MEMBER",
        "You are not an active member of this organization",
        403,
      );
    }

    await prisma.user.update({
      where: { id: params.userId },
      data: { activeOrganizationId: params.organizationId },
    });

    await setActiveOrgCookie(params.organizationId);

    if (params.authSubject && isServiceRoleConfigured()) {
      try {
        const admin = createSupabaseAdminClient();
        await admin.auth.admin.updateUserById(params.authSubject, {
          app_metadata: {
            active_organization_id: params.organizationId,
          },
        });
      } catch (error) {
        logger.warn("Failed to sync active org to app_metadata", {
          span: "org.switch",
          err:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : { message: String(error) },
        });
      }
    }

    await writeAuditLog({
      actorUserId: params.userId,
      organizationId: params.organizationId,
      action: "organization.switched",
      resourceType: "organization",
      resourceId: params.organizationId,
    });

    return apiSuccess({ organizationId: params.organizationId });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("SWITCH_ORG_FAILED", "Could not switch organization");
  }
}

export async function createBusinessOrganization(params: {
  userId: string;
  email: string;
  name: string;
}): Promise<ApiResponse<{ organizationId: string }>> {
  try {
    const baseSlug = slugifyHandle(params.name);
    let slug = baseSlug;
    for (let i = 0; i < 10; i += 1) {
      const taken = await prisma.organization.findUnique({ where: { slug } });
      if (!taken) break;
      slug = `${baseSlug}-${i + 1}`;
    }

    const publicId = await allocateOrganizationPublicId();

    const org = await prisma.organization.create({
      data: {
        publicId,
        name: params.name.trim(),
        slug,
        kind: "business",
        ownerUserId: params.userId,
        billingEmail: params.email.toLowerCase(),
        members: {
          create: {
            userId: params.userId,
            orgRole: "owner",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
    });

    await writeAuditLog({
      actorUserId: params.userId,
      organizationId: org.id,
      action: "organization.created",
      resourceType: "organization",
      resourceId: org.id,
      metadata: { kind: "business", publicId },
    });

    return apiSuccess({ organizationId: org.id });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("CREATE_ORG_FAILED", "Could not create organization");
  }
}

export async function createInvitation(params: {
  actorUserId: string;
  actorOrgRole: OrgRole;
  organizationId: string;
  email: string;
  orgRole: Exclude<OrgRole, "owner" | "custom">;
}): Promise<ApiResponse<InviteResult>> {
  try {
    assertCanInOrg(
      {
        userId: params.actorUserId as never,
        accountType: "individual",
        userTypes: [],
        participation: null,
        tenant: {
          organizationId: params.organizationId as never,
          workspaceId: null,
          teamIds: [],
        },
        orgRoles: [params.actorOrgRole],
        isAuthenticated: true,
      },
      "org.members.invite",
      params.actorOrgRole,
    );

    const token = generateOpaqueToken(32);
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const invitation = await prisma.organizationInvitation.create({
      data: {
        organizationId: params.organizationId,
        email: params.email.toLowerCase(),
        orgRole: params.orgRole,
        tokenHash,
        invitedByUserId: params.actorUserId,
        expiresAt,
      },
    });

    await writeAuditLog({
      actorUserId: params.actorUserId,
      organizationId: params.organizationId,
      action: "member.invited",
      resourceType: "organization_invitation",
      resourceId: invitation.id,
      metadata: { email: params.email, orgRole: params.orgRole },
    });

    const env = getEnv();
    return apiSuccess({
      invitationId: invitation.id,
      inviteUrl: `${env.NEXT_PUBLIC_APP_URL}/auth/accept-invite?token=${token}`,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("INVITE_FAILED", "Could not create invitation");
  }
}

export async function acceptInvitation(params: {
  userId: string;
  email: string | null;
  token: string;
}): Promise<ApiResponse<{ organizationId: string }>> {
  try {
    const tokenHash = await sha256Hex(params.token);
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { tokenHash },
    });

    if (!invitation || invitation.status !== "pending") {
      throw new AppError("INVALID_INVITE", "Invitation is invalid", 400);
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });
      throw new AppError("INVITE_EXPIRED", "Invitation has expired", 400);
    }

    if (
      params.email &&
      params.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      throw new AppError(
        "INVITE_EMAIL_MISMATCH",
        "Signed-in email does not match the invitation",
        403,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invitation.organizationId,
            userId: params.userId,
          },
        },
        create: {
          organizationId: invitation.organizationId,
          userId: params.userId,
          orgRole: invitation.orgRole,
          status: "active",
          joinedAt: new Date(),
        },
        update: {
          orgRole: invitation.orgRole,
          status: "active",
          joinedAt: new Date(),
        },
      });

      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });

      await tx.user.update({
        where: { id: params.userId },
        data: { activeOrganizationId: invitation.organizationId },
      });
    });

    await setActiveOrgCookie(invitation.organizationId);

    await writeAuditLog({
      actorUserId: params.userId,
      organizationId: invitation.organizationId,
      action: "member.accepted",
      resourceType: "organization_invitation",
      resourceId: invitation.id,
    });

    return apiSuccess({ organizationId: invitation.organizationId });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("ACCEPT_INVITE_FAILED", "Could not accept invitation");
  }
}

export async function leaveOrganization(params: {
  userId: string;
  organizationId: string;
}): Promise<ApiResponse<{ left: true }>> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: params.organizationId },
    });
    if (!org) {
      throw new AppError("NOT_FOUND", "Organization not found", 404);
    }
    if (org.kind === "personal") {
      throw new AppError(
        "CANNOT_LEAVE_PERSONAL",
        "You cannot leave your personal workspace",
        400,
      );
    }
    if (org.ownerUserId === params.userId) {
      throw new AppError(
        "OWNER_CANNOT_LEAVE",
        "Transfer ownership before leaving",
        400,
      );
    }

    await prisma.organizationMember.updateMany({
      where: {
        userId: params.userId,
        organizationId: params.organizationId,
        status: "active",
      },
      data: { status: "removed" },
    });

    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user?.activeOrganizationId === params.organizationId) {
      const personal = await prisma.organization.findFirst({
        where: { ownerUserId: params.userId, kind: "personal" },
      });
      if (personal) {
        await prisma.user.update({
          where: { id: params.userId },
          data: { activeOrganizationId: personal.id },
        });
        await setActiveOrgCookie(personal.id);
      }
    }

    await writeAuditLog({
      actorUserId: params.userId,
      organizationId: params.organizationId,
      action: "member.removed",
      resourceType: "organization_member",
      metadata: { reason: "left" },
    });

    return apiSuccess({ left: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("LEAVE_ORG_FAILED", "Could not leave organization");
  }
}

export async function changeMemberRole(params: {
  actorUserId: string;
  actorOrgRole: OrgRole;
  organizationId: string;
  memberUserId: string;
  orgRole: OrgRole;
}): Promise<ApiResponse<{ updated: true }>> {
  try {
    assertCanInOrg(
      {
        userId: params.actorUserId as never,
        accountType: "individual",
        userTypes: [],
        participation: null,
        tenant: {
          organizationId: params.organizationId as never,
          workspaceId: null,
          teamIds: [],
        },
        orgRoles: [params.actorOrgRole],
        isAuthenticated: true,
      },
      "org.roles.assign",
      params.actorOrgRole,
    );

    if (params.orgRole === "owner") {
      throw new AppError("INVALID_ROLE", "Use ownership transfer instead", 400);
    }

    await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId: params.organizationId,
          userId: params.memberUserId,
        },
      },
      data: { orgRole: params.orgRole },
    });

    await writeAuditLog({
      actorUserId: params.actorUserId,
      organizationId: params.organizationId,
      action: "member.role_changed",
      resourceType: "organization_member",
      resourceId: params.memberUserId,
      metadata: { orgRole: params.orgRole },
    });

    return apiSuccess({ updated: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("ROLE_CHANGE_FAILED", "Could not change role");
  }
}

export { personalOrganizationName };
