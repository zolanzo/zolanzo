/**
 * RBAC evaluation — platform + organization permissions.
 */

import {
  rolesHavePermission,
  type Permission,
} from "@/constants/permissions";
import {
  normalizeRole,
  USER_TYPE_DEFAULT_ROLES,
  type Role,
} from "@/constants/roles";
import {
  orgRoleHasPermission,
  type OrgPermission,
  type OrgRole,
} from "@/constants/org-roles";
import type { ActorContext } from "@/types/domain";
import { normalizeUserType } from "@/types/domain";
import { AppError } from "@/lib/api/response";

export type AccessDecision = {
  allowed: boolean;
  reason?: string;
};

export type RoleSource = {
  platformRoles?: readonly Role[];
};

export function resolveRoles(
  actor: ActorContext,
  source: RoleSource = {},
): Role[] {
  if (!actor.isAuthenticated || !actor.userId) {
    return ["guest"];
  }

  const roles = new Set<Role>();

  for (const role of source.platformRoles ?? []) {
    roles.add(normalizeRole(role));
  }

  for (const userType of actor.userTypes) {
    const normalized = normalizeUserType(userType);
    for (const role of USER_TYPE_DEFAULT_ROLES[normalized]) {
      roles.add(normalizeRole(role));
    }
  }

  if (actor.participation === "client" || actor.participation === "both") {
    roles.add("client");
  }
  if (actor.participation === "worker" || actor.participation === "both") {
    roles.add("worker");
  }

  if (roles.size === 0) {
    roles.add("guest");
  }

  return [...roles];
}

export function can(
  actor: ActorContext,
  permission: Permission,
  source: RoleSource = {},
): AccessDecision {
  const roles = resolveRoles(actor, source);
  const allowed = rolesHavePermission(roles, permission);
  return {
    allowed,
    reason: allowed ? undefined : `Missing permission: ${permission}`,
  };
}

export function assertCan(
  actor: ActorContext,
  permission: Permission,
  source: RoleSource = {},
): void {
  const decision = can(actor, permission, source);
  if (!decision.allowed) {
    throw new AppError(
      "FORBIDDEN",
      decision.reason ?? "Forbidden",
      403,
    );
  }
}

export function canInOrg(
  actor: ActorContext,
  permission: OrgPermission,
  role: OrgRole,
): AccessDecision {
  if (!actor.isAuthenticated || !actor.tenant.organizationId) {
    return { allowed: false, reason: "No organization context" };
  }
  const allowed = orgRoleHasPermission(role, permission);
  return {
    allowed,
    reason: allowed ? undefined : `Missing org permission: ${permission}`,
  };
}

export function assertCanInOrg(
  actor: ActorContext,
  permission: OrgPermission,
  role: OrgRole,
): void {
  const decision = canInOrg(actor, permission, role);
  if (!decision.allowed) {
    throw new AppError(
      "FORBIDDEN",
      decision.reason ?? "Forbidden",
      403,
    );
  }
}

export function hasPlatformRole(
  roles: readonly Role[],
  required: Role | Role[],
): boolean {
  const needed = Array.isArray(required) ? required : [required];
  const normalized = roles.map(normalizeRole);
  return needed.some((r) => normalized.includes(normalizeRole(r)));
}
