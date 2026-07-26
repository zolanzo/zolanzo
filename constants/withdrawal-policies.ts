/**
 * Withdrawal policy catalog — how/when workers can cash out.
 */

import type { WithdrawalPolicyKey } from "@/constants/finance-enums";

export type WithdrawalPolicyDefinition = {
  key: WithdrawalPolicyKey;
  name: string;
  description: string;
  approvalMode: "automatic" | "manual" | "threshold";
  /** Amount above which manual approval is required (threshold mode) */
  approvalThresholdMinor: number | null;
  batchMode: "none" | "daily" | "weekly";
  minAmountMinor: number;
  maxAmountMinor: number | null;
  /** Minimum remaining available after withdrawal */
  minimumBalanceMinor: number;
  /** Hours between completed withdrawals */
  coolingPeriodHours: number;
  requiresVerifiedDestination: boolean;
};

export const WITHDRAWAL_POLICIES: Record<
  WithdrawalPolicyKey,
  WithdrawalPolicyDefinition
> = {
  immediate: {
    key: "immediate",
    name: "Immediate",
    description: "Auto-approve and schedule for processing when eligible.",
    approvalMode: "automatic",
    approvalThresholdMinor: null,
    batchMode: "none",
    minAmountMinor: 100_00,
    maxAmountMinor: null,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  manual_approval: {
    key: "manual_approval",
    name: "Manual Approval",
    description: "Every withdrawal requires finance approval.",
    approvalMode: "manual",
    approvalThresholdMinor: null,
    batchMode: "none",
    minAmountMinor: 100_00,
    maxAmountMinor: null,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  threshold_approval: {
    key: "threshold_approval",
    name: "Threshold Approval",
    description: "Auto-approve below threshold; manual above.",
    approvalMode: "threshold",
    approvalThresholdMinor: 50_000_00,
    batchMode: "none",
    minAmountMinor: 100_00,
    maxAmountMinor: null,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  scheduled_batch: {
    key: "scheduled_batch",
    name: "Scheduled Batch",
    description: "Approved withdrawals join the next payout batch.",
    approvalMode: "automatic",
    approvalThresholdMinor: null,
    batchMode: "daily",
    minAmountMinor: 100_00,
    maxAmountMinor: null,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  daily_window: {
    key: "daily_window",
    name: "Daily Window",
    description: "Batch once per UTC day.",
    approvalMode: "automatic",
    approvalThresholdMinor: null,
    batchMode: "daily",
    minAmountMinor: 100_00,
    maxAmountMinor: 500_000_00,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  weekly_window: {
    key: "weekly_window",
    name: "Weekly Window",
    description: "Batch once per UTC week.",
    approvalMode: "automatic",
    approvalThresholdMinor: null,
    batchMode: "weekly",
    minAmountMinor: 100_00,
    maxAmountMinor: 1_000_000_00,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 24,
    requiresVerifiedDestination: true,
  },
  minimum_balance: {
    key: "minimum_balance",
    name: "Minimum Balance",
    description: "Require a residual available balance after withdrawal.",
    approvalMode: "automatic",
    approvalThresholdMinor: null,
    batchMode: "none",
    minAmountMinor: 100_00,
    maxAmountMinor: null,
    minimumBalanceMinor: 500_00,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  maximum_amount: {
    key: "maximum_amount",
    name: "Maximum Amount",
    description: "Cap single withdrawal amount.",
    approvalMode: "manual",
    approvalThresholdMinor: null,
    batchMode: "none",
    minAmountMinor: 100_00,
    maxAmountMinor: 100_000_00,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 0,
    requiresVerifiedDestination: true,
  },
  cooling_period: {
    key: "cooling_period",
    name: "Cooling Period",
    description: "Enforce hours between completed withdrawals.",
    approvalMode: "automatic",
    approvalThresholdMinor: null,
    batchMode: "none",
    minAmountMinor: 100_00,
    maxAmountMinor: null,
    minimumBalanceMinor: 0,
    coolingPeriodHours: 48,
    requiresVerifiedDestination: true,
  },
};

export function getWithdrawalPolicy(
  key: WithdrawalPolicyKey,
): WithdrawalPolicyDefinition {
  return WITHDRAWAL_POLICIES[key];
}

export function listWithdrawalPolicies(): WithdrawalPolicyDefinition[] {
  return Object.values(WITHDRAWAL_POLICIES);
}
