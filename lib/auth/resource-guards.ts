/**
 * Resource-level authorization helpers for IDOR prevention.
 * Actions/services call these after loading a row by public/internal id.
 */

import { AppError } from "@/lib/api/response";
import type { SessionUser } from "@/lib/auth/session";
import {
  ORG_ROLES,
  orgRoleHasPermission,
  type OrgRole,
} from "@/constants/org-roles";

export function assertSameUser(
  resourceUserId: string,
  actorUserId: string,
  message = "You do not own this resource",
): void {
  if (resourceUserId !== actorUserId) {
    throw new AppError("FORBIDDEN", message, 403);
  }
}

export function isOrgMember(
  user: Pick<SessionUser, "memberships">,
  organizationId: string,
): boolean {
  return user.memberships.some(
    (m) => m.organizationId === organizationId && m.status === "active",
  );
}

export function assertOrgMember(
  user: Pick<SessionUser, "memberships" | "id">,
  organizationId: string,
  message = "Not a member of this organization",
): void {
  if (!isOrgMember(user, organizationId)) {
    throw new AppError("FORBIDDEN", message, 403);
  }
}

export function assertCampaignAccess(params: {
  user: Pick<SessionUser, "id" | "memberships" | "platformRoles">;
  organizationId: string;
  clientUserId: string;
  allowStaff?: boolean;
}): void {
  const { user, organizationId, clientUserId, allowStaff = true } = params;
  if (clientUserId === user.id) return;
  if (isOrgMember(user, organizationId)) return;
  if (
    allowStaff &&
    user.platformRoles.some((r) =>
      ["admin", "super_admin", "operations", "finance", "auditor"].includes(r),
    )
  ) {
    return;
  }
  throw new AppError("FORBIDDEN", "Cannot access this campaign", 403);
}

function isStaffReviewer(
  user: Pick<SessionUser, "platformRoles">,
): boolean {
  return user.platformRoles.some((r) =>
    ["admin", "super_admin", "operations", "moderator", "reviewer"].includes(r),
  );
}

function membershipOrgRole(
  user: Pick<SessionUser, "memberships">,
  organizationId: string,
): OrgRole | null {
  const membership = user.memberships.find(
    (m) => m.organizationId === organizationId && m.status === "active",
  );
  if (!membership) return null;
  return (ORG_ROLES as readonly string[]).includes(membership.orgRole)
    ? (membership.orgRole as OrgRole)
    : null;
}

/** Hirer may review only campaigns they own or orgs they can review in. */
export function assertHirerReviewAccess(params: {
  user: Pick<SessionUser, "id" | "memberships" | "platformRoles">;
  organizationId: string;
  clientUserId: string;
}): void {
  const { user, organizationId, clientUserId } = params;
  assertCampaignAccess({
    user,
    organizationId,
    clientUserId,
    allowStaff: true,
  });
  if (clientUserId === user.id) return;
  if (isStaffReviewer(user)) return;
  const orgRole = membershipOrgRole(user, organizationId);
  if (!orgRole || !orgRoleHasPermission(orgRole, "org.submissions.review")) {
    throw new AppError(
      "FORBIDDEN",
      "You cannot review submissions for this campaign",
      403,
    );
  }
}

export function assertPaymentIntentAccess(params: {
  user: Pick<SessionUser, "id" | "memberships" | "platformRoles">;
  clientUserId: string;
  organizationId: string;
}): void {
  const { user, clientUserId, organizationId } = params;
  if (clientUserId === user.id) return;
  if (isOrgMember(user, organizationId)) return;
  if (
    user.platformRoles.some((r) =>
      ["admin", "super_admin", "finance", "operations"].includes(r),
    )
  ) {
    return;
  }
  throw new AppError("FORBIDDEN", "Cannot access this payment", 403);
}

export function assertWalletAccess(params: {
  user: Pick<SessionUser, "id" | "memberships" | "platformRoles">;
  ownerUserId: string | null;
  organizationId: string | null;
}): void {
  const { user, ownerUserId, organizationId } = params;
  if (ownerUserId && ownerUserId === user.id) return;
  if (organizationId && isOrgMember(user, organizationId)) return;
  if (
    user.platformRoles.some((r) =>
      ["admin", "super_admin", "finance", "operations", "auditor"].includes(r),
    )
  ) {
    return;
  }
  throw new AppError("FORBIDDEN", "Cannot access this wallet", 403);
}

export function assertSubmissionAccess(params: {
  workerUserId: string;
  actorUserId: string;
  allowReviewer?: boolean;
  platformRoles?: readonly string[];
}): void {
  if (params.workerUserId === params.actorUserId) return;
  if (
    params.allowReviewer &&
    params.platformRoles?.some((r) =>
      [
        "admin",
        "super_admin",
        "reviewer",
        "operations",
        "moderator",
      ].includes(r),
    )
  ) {
    return;
  }
  throw new AppError("FORBIDDEN", "Cannot access this submission", 403);
}
