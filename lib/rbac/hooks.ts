"use client";

import { useCallback, useMemo } from "react";
import {
  can,
  canInOrg,
  resolveRoles,
  type RoleSource,
} from "@/lib/rbac/access";
import type { Permission } from "@/constants/permissions";
import type { OrgPermission, OrgRole } from "@/constants/org-roles";
import type { ActorContext } from "@/types/domain";
import type { Role } from "@/constants/roles";

export type ClientAuthSnapshot = {
  actor: ActorContext;
  platformRoles: Role[];
  activeOrgRole: OrgRole | null;
};

/**
 * Client-side permission helpers — mirror server decisions for UI gating only.
 * Never trust for security; server guards are authoritative.
 */
export function usePermissions(snapshot: ClientAuthSnapshot | null) {
  const source: RoleSource = useMemo(
    () => ({ platformRoles: snapshot?.platformRoles ?? [] }),
    [snapshot?.platformRoles],
  );

  const roles = useMemo(() => {
    if (!snapshot) return ["guest" as Role];
    return resolveRoles(snapshot.actor, source);
  }, [snapshot, source]);

  const canDo = useCallback(
    (permission: Permission) => {
      if (!snapshot) return false;
      return can(snapshot.actor, permission, source).allowed;
    },
    [snapshot, source],
  );

  const canDoInOrg = useCallback(
    (permission: OrgPermission) => {
      if (!snapshot?.activeOrgRole) return false;
      return canInOrg(snapshot.actor, permission, snapshot.activeOrgRole)
        .allowed;
    },
    [snapshot],
  );

  return { roles, canDo, canDoInOrg, isAuthenticated: Boolean(snapshot) };
}
