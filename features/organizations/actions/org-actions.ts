"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { requireOrgPermission } from "@/lib/rbac/guards";
import {
  acceptInvitation,
  changeMemberRole,
  createBusinessOrganization,
  createInvitation,
  leaveOrganization,
  switchActiveOrganization,
  type InviteResult,
} from "@/features/organizations/services/organization-service";
import type { OrgRole } from "@/constants/org-roles";

export async function switchOrganizationAction(
  organizationId: string,
): Promise<ApiResponse<{ organizationId: string }>> {
  const ctx = await requireAuthContext();
  return switchActiveOrganization({
    userId: ctx.user.id,
    organizationId,
    authSubject: ctx.supabaseUserId,
  });
}

export async function createOrganizationAction(input: {
  name: string;
}): Promise<ApiResponse<{ organizationId: string }>> {
  const ctx = await requireAuthContext();
  return createBusinessOrganization({
    userId: ctx.user.id,
    email: ctx.user.email ?? "billing@zolanzo.com",
    name: input.name,
  });
}

export async function inviteMemberAction(input: {
  email: string;
  orgRole: Exclude<OrgRole, "owner" | "custom">;
}): Promise<ApiResponse<InviteResult>> {
  const ctx = await requireOrgPermission("org.members.invite");
  if (!ctx.user.activeOrganizationId || !ctx.activeOrgRole) {
    return {
      ok: false,
      error: { code: "NO_ORG", message: "No active organization" },
    };
  }
  return createInvitation({
    actorUserId: ctx.user.id,
    actorOrgRole: ctx.activeOrgRole,
    organizationId: ctx.user.activeOrganizationId,
    email: input.email,
    orgRole: input.orgRole,
  });
}

export async function acceptInvitationAction(
  token: string,
): Promise<ApiResponse<{ organizationId: string }>> {
  const ctx = await requireAuthContext();
  return acceptInvitation({
    userId: ctx.user.id,
    email: ctx.user.email,
    token,
  });
}

export async function leaveOrganizationAction(
  organizationId: string,
): Promise<ApiResponse<{ left: true }>> {
  const ctx = await requireAuthContext();
  return leaveOrganization({
    userId: ctx.user.id,
    organizationId,
  });
}

export async function changeMemberRoleAction(input: {
  memberUserId: string;
  orgRole: OrgRole;
}): Promise<ApiResponse<{ updated: true }>> {
  const ctx = await requireOrgPermission("org.roles.assign");
  if (!ctx.user.activeOrganizationId || !ctx.activeOrgRole) {
    return {
      ok: false,
      error: { code: "NO_ORG", message: "No active organization" },
    };
  }
  return changeMemberRole({
    actorUserId: ctx.user.id,
    actorOrgRole: ctx.activeOrgRole,
    organizationId: ctx.user.activeOrganizationId,
    memberUserId: input.memberUserId,
    orgRole: input.orgRole,
  });
}
