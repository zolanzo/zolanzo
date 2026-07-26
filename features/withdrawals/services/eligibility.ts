/**
 * Withdrawal eligibility — structured results, no side effects.
 */

import type { WithdrawalPolicyDefinition } from "@/constants/withdrawal-policies";
import type { WalletProjectionView } from "@/features/wallet/services/projection";

export type EligibilityCheck = {
  id: string;
  passed: boolean;
  message: string;
};

export type EligibilityResult = {
  eligible: boolean;
  checks: EligibilityCheck[];
  availableMinor: number;
  heldMinor: number;
  pendingSettlementsMinor: number;
  reservedMinor: number;
  withdrawableMinor: number;
};

export type EligibilityInput = {
  amountMinor: number;
  feeMinor: number;
  policy: WithdrawalPolicyDefinition;
  projection: WalletProjectionView;
  reservedMinor: number;
  pendingSettlementsMinor: number;
  outstandingReviewCount: number;
  destinationVerified: boolean;
  destinationKindActive: boolean;
  hoursSinceLastCompleted: number | null;
  accountVerificationLevel: "none" | "email" | "phone" | "identity" | "kyc";
};

export function evaluateWithdrawalEligibility(
  input: EligibilityInput,
): EligibilityResult {
  const checks: EligibilityCheck[] = [];
  const reserved = Math.max(0, input.reservedMinor);
  const withdrawable = Math.max(
    0,
    input.projection.availableMinor - reserved,
  );

  const push = (id: string, passed: boolean, message: string) => {
    checks.push({ id, passed, message });
  };

  push(
    "destination_kind",
    input.destinationKindActive,
    input.destinationKindActive
      ? "Destination kind is active"
      : "Destination kind is not active (placeholder)",
  );

  if (input.policy.requiresVerifiedDestination) {
    push(
      "destination_verified",
      input.destinationVerified,
      input.destinationVerified
        ? "Destination verified"
        : "Destination account is not verified",
    );
  }

  push(
    "available_balance",
    withdrawable >= input.amountMinor,
    `Withdrawable ${withdrawable} vs requested ${input.amountMinor}`,
  );

  push(
    "min_amount",
    input.amountMinor >= input.policy.minAmountMinor,
    `Minimum ${input.policy.minAmountMinor}`,
  );

  if (input.policy.maxAmountMinor !== null) {
    push(
      "max_amount",
      input.amountMinor <= input.policy.maxAmountMinor,
      `Maximum ${input.policy.maxAmountMinor}`,
    );
  }

  const remaining = withdrawable - input.amountMinor;
  push(
    "minimum_balance",
    remaining >= input.policy.minimumBalanceMinor,
    `Residual after withdrawal ${remaining} (need ≥ ${input.policy.minimumBalanceMinor})`,
  );

  if (input.policy.coolingPeriodHours > 0) {
    const hours = input.hoursSinceLastCompleted;
    const ok =
      hours === null || hours >= input.policy.coolingPeriodHours;
    push(
      "cooling_period",
      ok,
      ok
        ? "Cooling period satisfied"
        : `Cooling period ${input.policy.coolingPeriodHours}h not met`,
    );
  }

  push(
    "outstanding_reviews",
    input.outstandingReviewCount === 0,
    input.outstandingReviewCount === 0
      ? "No outstanding reviews"
      : `${input.outstandingReviewCount} outstanding review(s)`,
  );

  // Soft compliance placeholder — email+ is enough for Phase 2
  const identityOk =
    input.accountVerificationLevel !== "none";
  push(
    "account_verification",
    identityOk,
    identityOk
      ? `Identity status: ${input.accountVerificationLevel}`
      : "Account verification required",
  );

  push(
    "pending_settlements_info",
    true,
    `Pending settlements: ${input.pendingSettlementsMinor} (informational)`,
  );

  const eligible = checks
    .filter((c) => c.id !== "pending_settlements_info")
    .every((c) => c.passed);

  return {
    eligible,
    checks,
    availableMinor: input.projection.availableMinor,
    heldMinor: input.projection.heldMinor,
    pendingSettlementsMinor: input.pendingSettlementsMinor,
    reservedMinor: reserved,
    withdrawableMinor: withdrawable,
  };
}

export function requiresManualApproval(
  policy: WithdrawalPolicyDefinition,
  amountMinor: number,
): boolean {
  if (policy.approvalMode === "manual") return true;
  if (
    policy.approvalMode === "threshold" &&
    policy.approvalThresholdMinor !== null &&
    amountMinor >= policy.approvalThresholdMinor
  ) {
    return true;
  }
  return false;
}
