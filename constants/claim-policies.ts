/**
 * Claim policies — how available work may be claimed.
 * Distinct from eligibility constraints (can the worker perform the work?).
 */

export const CLAIM_POLICIES = [
  "one_active_per_campaign",
  "max_concurrent_assignments",
  "cooldown_after_completion",
  "invite_only",
  "organization_only",
  "first_come_first_served",
  "lottery_future",
  "priority_trust_future",
] as const;

export type ClaimPolicyKind = (typeof CLAIM_POLICIES)[number];

export type ClaimPolicyRule =
  | { kind: "one_active_per_campaign" }
  | { kind: "max_concurrent_assignments"; max: number }
  | { kind: "cooldown_after_completion"; cooldownMinutes: number }
  | { kind: "invite_only"; inviteTokenRequired?: boolean }
  | { kind: "organization_only"; organizationIds?: string[] }
  | { kind: "first_come_first_served" }
  | { kind: "lottery_future"; weightKey?: string }
  | { kind: "priority_trust_future"; minTrustScore?: number };

export const DEFAULT_RESERVATION_TIMEOUT_SECONDS = 120;

export function isClaimPolicyKind(value: string): value is ClaimPolicyKind {
  return (CLAIM_POLICIES as readonly string[]).includes(value);
}

export function validateClaimPolicyRules(
  rules: readonly ClaimPolicyRule[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  for (const rule of rules) {
    if (!isClaimPolicyKind(rule.kind)) {
      errors.push(`Unknown claim policy: ${(rule as ClaimPolicyRule).kind}`);
      continue;
    }
    if (rule.kind === "max_concurrent_assignments" && rule.max < 1) {
      errors.push("max_concurrent_assignments.max must be >= 1");
    }
    if (rule.kind === "cooldown_after_completion" && rule.cooldownMinutes < 0) {
      errors.push("cooldown_after_completion.cooldownMinutes must be >= 0");
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
