/**
 * Settlement policies — when/how approved work becomes ledger money.
 * Separate from Review Policies (decision process).
 */

import type { SettlementPolicyKey } from "@/constants/finance-enums";

export type SettlementPolicyDefinition = {
  key: SettlementPolicyKey;
  name: string;
  description: string;
  /** Hold days before release (0 = immediate) */
  holdDays: number;
  /** Requires finance operator approval before processing */
  requiresManualApproval: boolean;
  /** Prefer attaching to a settlement batch */
  batchMode: "none" | "daily" | "weekly";
  /** Wait until campaign completes before settling */
  waitForCampaignCompletion: boolean;
};

export const SETTLEMENT_POLICIES: Record<
  SettlementPolicyKey,
  SettlementPolicyDefinition
> = {
  immediate: {
    key: "immediate",
    name: "Immediate",
    description: "Settle as soon as review approves.",
    holdDays: 0,
    requiresManualApproval: false,
    batchMode: "none",
    waitForCampaignCompletion: false,
  },
  hold_period: {
    key: "hold_period",
    name: "Hold Period",
    description: "Hold for a fixed number of days after approval.",
    holdDays: 7,
    requiresManualApproval: false,
    batchMode: "none",
    waitForCampaignCompletion: false,
  },
  campaign_completion: {
    key: "campaign_completion",
    name: "Campaign Completion",
    description: "Settle only after the campaign closes.",
    holdDays: 0,
    requiresManualApproval: false,
    batchMode: "none",
    waitForCampaignCompletion: true,
  },
  daily_batch: {
    key: "daily_batch",
    name: "Daily Batch",
    description: "Group into daily settlement batches.",
    holdDays: 0,
    requiresManualApproval: false,
    batchMode: "daily",
    waitForCampaignCompletion: false,
  },
  weekly_batch: {
    key: "weekly_batch",
    name: "Weekly Batch",
    description: "Group into weekly settlement batches.",
    holdDays: 0,
    requiresManualApproval: false,
    batchMode: "weekly",
    waitForCampaignCompletion: false,
  },
  manual_finance_approval: {
    key: "manual_finance_approval",
    name: "Manual Finance Approval",
    description: "Requires finance approval before ledger release.",
    holdDays: 0,
    requiresManualApproval: true,
    batchMode: "none",
    waitForCampaignCompletion: false,
  },
};

export function getSettlementPolicy(
  key: SettlementPolicyKey,
): SettlementPolicyDefinition {
  return SETTLEMENT_POLICIES[key];
}

export function listSettlementPolicies(): SettlementPolicyDefinition[] {
  return Object.values(SETTLEMENT_POLICIES);
}
