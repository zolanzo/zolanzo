/**
 * PermissionFilter — map intents to required permissions.
 * No privilege escalation: caller must already hold the permission.
 */

import type { OrgCopilotIntent } from "@/lib/ai/copilot/org-types";
import type { Permission } from "@/constants/permissions";

export type OrgCopilotAuthContext = {
  organizationId: string;
  actorUserId: string;
  /** True when actor is an active member of the organization */
  isOrgMember: boolean;
  /** Permissions already granted in this org (from RBAC) */
  permissions: readonly Permission[];
};

const INTENT_PERMISSIONS: Record<OrgCopilotIntent, Permission[]> = {
  campaign_performance: ["campaigns.read"],
  campaigns_behind_schedule: ["campaigns.read"],
  top_workers: ["campaigns.read"],
  reviewer_workload: ["campaigns.read"],
  pending_payments: ["payments.create", "campaigns.read"],
  fraud_trends: ["campaigns.read"],
  completion_rates: ["campaigns.read"],
  regional_performance: ["campaigns.read"],
  organization_spending: ["payments.create", "campaigns.read"],
  assignment_backlog: ["campaigns.read"],
  inactive_workers: ["campaigns.read"],
  highest_trust_workers: ["campaigns.read"],
  declining_trust: ["campaigns.read"],
  recently_improved_trust: ["campaigns.read"],
  strongest_reliability: ["campaigns.read"],
  follow_up: ["campaigns.read"],
  unknown: ["campaigns.read"],
};

export function requiredPermissionsForIntent(
  intent: OrgCopilotIntent,
): Permission[] {
  return INTENT_PERMISSIONS[intent] ?? ["campaigns.read"];
}

/**
 * Returns true when the actor may retrieve data for this intent.
 * Requires org membership AND at least one of the required permissions.
 */
export function canAccessOrgCopilotIntent(
  auth: OrgCopilotAuthContext,
  intent: OrgCopilotIntent,
): boolean {
  if (!auth.isOrgMember) return false;
  if (auth.organizationId.trim().length === 0) return false;
  const required = requiredPermissionsForIntent(intent);
  if (required.length === 0) return true;
  return required.some((p) => auth.permissions.includes(p));
}

export function filterFactsByPermission<T>(params: {
  auth: OrgCopilotAuthContext;
  intent: OrgCopilotIntent;
  facts: T;
  empty: T;
}): { allowed: boolean; facts: T; denialReason: string | null } {
  if (!canAccessOrgCopilotIntent(params.auth, params.intent)) {
    return {
      allowed: false,
      facts: params.empty,
      denialReason: params.auth.isOrgMember
        ? "Missing permission for this question"
        : "Not a member of this organization",
    };
  }
  return { allowed: true, facts: params.facts, denialReason: null };
}
