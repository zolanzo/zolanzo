/**
 * LifecycleManager — controlled state transitions for governed rules.
 */

import type {
  GovernanceLifecycleState,
  GovernanceRole,
} from "@/lib/automation/governance/types";

const TRANSITIONS: Record<
  GovernanceLifecycleState,
  Partial<Record<GovernanceLifecycleState, GovernanceRole[]>>
> = {
  draft: {
    under_review: ["author", "administrator"],
    archived: ["author", "administrator"],
  },
  under_review: {
    approved: ["approver", "administrator"],
    draft: ["reviewer", "approver", "administrator"],
    archived: ["administrator"],
  },
  approved: {
    published: ["approver", "administrator"],
    draft: ["author", "administrator"],
    under_review: ["author", "administrator"],
  },
  published: {
    disabled: ["approver", "administrator"],
    archived: ["administrator"],
  },
  disabled: {
    published: ["approver", "administrator"],
    draft: ["author", "administrator"],
    archived: ["administrator"],
  },
  archived: {},
};

export function canTransition(
  from: GovernanceLifecycleState,
  to: GovernanceLifecycleState,
  role: GovernanceRole,
): boolean {
  const allowed = TRANSITIONS[from]?.[to];
  if (!allowed) return false;
  return allowed.includes(role) || role === "administrator";
}

export function assertTransition(
  from: GovernanceLifecycleState,
  to: GovernanceLifecycleState,
  role: GovernanceRole,
): { ok: true } | { ok: false; error: string } {
  if (from === to) return { ok: true };
  if (!canTransition(from, to, role)) {
    return {
      ok: false,
      error: `Transition ${from} → ${to} not allowed for role ${role}`,
    };
  }
  return { ok: true };
}

export function allowedNextStates(
  from: GovernanceLifecycleState,
  role: GovernanceRole,
): GovernanceLifecycleState[] {
  const map = TRANSITIONS[from] ?? {};
  return (Object.keys(map) as GovernanceLifecycleState[]).filter((to) =>
    canTransition(from, to, role),
  );
}

export const LifecycleManager = {
  canTransition,
  assert: assertTransition,
  nextStates: allowedNextStates,
  transitions: TRANSITIONS,
};
