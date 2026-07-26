import "server-only";

import type { Permission } from "@/constants/permissions";
import type { OrgPermission } from "@/constants/org-roles";
import {
  assertCan,
  assertCanInOrg,
  can,
  canInOrg,
  hasPlatformRole,
} from "@/lib/rbac/access";
import {
  getAuthContext,
  requireAuthContext,
  type AuthContext,
} from "@/lib/auth/session";
import { AppError } from "@/lib/api/response";
import type { Role } from "@/constants/roles";

export async function requirePermission(
  permission: Permission,
): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  assertCan(ctx.actor, permission, { platformRoles: ctx.user.platformRoles });
  return ctx;
}

export async function requireOrgPermission(
  permission: OrgPermission,
): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  if (!ctx.activeOrgRole) {
    throw new AppError("NO_ORG_CONTEXT", "Active organization required", 403);
  }
  assertCanInOrg(ctx.actor, permission, ctx.activeOrgRole);
  return ctx;
}

export async function requirePlatformRoles(
  ...roles: Role[]
): Promise<AuthContext> {
  const ctx = await requireAuthContext();
  if (!hasPlatformRole(ctx.user.platformRoles, roles)) {
    throw new AppError("FORBIDDEN", "Insufficient platform role", 403);
  }
  return ctx;
}

export async function checkPermission(
  permission: Permission,
): Promise<boolean> {
  const ctx = await getAuthContext();
  if (!ctx) return false;
  return can(ctx.actor, permission, {
    platformRoles: ctx.user.platformRoles,
  }).allowed;
}

export async function checkOrgPermission(
  permission: OrgPermission,
): Promise<boolean> {
  const ctx = await getAuthContext();
  if (!ctx?.activeOrgRole) return false;
  return canInOrg(ctx.actor, permission, ctx.activeOrgRole).allowed;
}
