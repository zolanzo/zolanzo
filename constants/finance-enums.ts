/**
 * Escrow, withdrawal rails, settlement — financial domain enums.
 * EscrowStatus also mirrored in work-states for work-engine coupling;
 * finance module is source of truth for money.
 */

export const FINANCE_ESCROW_STATUSES = [
  "reserved",
  "held",
  "released",
  "refunded",
  "expired",
  "partially_released",
  "split_released",
] as const;

export type FinanceEscrowStatus = (typeof FINANCE_ESCROW_STATUSES)[number];

export const WITHDRAWAL_METHODS = [
  "bank_transfer",
  "mobile_money",
  "paypal",
  "crypto",
  "gift_card",
  "manual_settlement",
] as const;

export type WithdrawalMethod = (typeof WITHDRAWAL_METHODS)[number];

export const WITHDRAWAL_METHOD_STATUS: Record<
  WithdrawalMethod,
  "active" | "planned" | "future"
> = {
  bank_transfer: "active",
  mobile_money: "future",
  paypal: "future",
  crypto: "future",
  gift_card: "future",
  manual_settlement: "planned",
};

/** @deprecated Prefer WithdrawalRequestStatus */
export const WITHDRAWAL_STATUSES = [
  "requested",
  "approved",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "returned",
] as const;

export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

/** Withdrawal Request lifecycle (Sprint 11) */
export const WITHDRAWAL_REQUEST_STATUSES = [
  "draft",
  "pending",
  "pending_approval",
  "approved",
  "scheduled",
  "processing",
  "completed",
  "rejected",
  "cancelled",
  "failed",
] as const;

export type WithdrawalRequestStatus =
  (typeof WITHDRAWAL_REQUEST_STATUSES)[number];

export const WITHDRAWAL_REQUEST_TRANSITIONS: Record<
  WithdrawalRequestStatus,
  readonly WithdrawalRequestStatus[]
> = {
  draft: ["pending", "cancelled"],
  pending: ["pending_approval", "approved", "scheduled", "cancelled", "rejected"],
  pending_approval: ["approved", "rejected", "cancelled"],
  approved: ["scheduled", "processing", "cancelled"],
  scheduled: ["processing", "cancelled", "failed"],
  processing: ["completed", "failed", "cancelled"],
  completed: [],
  rejected: [],
  cancelled: [],
  failed: ["pending", "cancelled"],
};

export const WITHDRAWAL_POLICY_KEYS = [
  "immediate",
  "manual_approval",
  "threshold_approval",
  "scheduled_batch",
  "daily_window",
  "weekly_window",
  "minimum_balance",
  "maximum_amount",
  "cooling_period",
] as const;

export type WithdrawalPolicyKey = (typeof WITHDRAWAL_POLICY_KEYS)[number];

export const DESTINATION_ACCOUNT_KINDS = [
  "bank_account",
  "mobile_money",
  "digital_wallet",
  "crypto_wallet",
] as const;

export type DestinationAccountKind = (typeof DESTINATION_ACCOUNT_KINDS)[number];

export const DESTINATION_ACCOUNT_KIND_STATUS: Record<
  DestinationAccountKind,
  "active" | "placeholder"
> = {
  bank_account: "active",
  mobile_money: "placeholder",
  digital_wallet: "placeholder",
  crypto_wallet: "placeholder",
};

export const WITHDRAWAL_BATCH_STATUSES = [
  "created",
  "scheduled",
  "processing",
  "completed",
  "failed",
  "reconciled",
] as const;

export type WithdrawalBatchStatus = (typeof WITHDRAWAL_BATCH_STATUSES)[number];

export const WITHDRAWAL_APPROVAL_DECISIONS = [
  "approved",
  "rejected",
] as const;

export type WithdrawalApprovalDecision =
  (typeof WITHDRAWAL_APPROVAL_DECISIONS)[number];

export const WITHDRAWAL_INTENT_STATUSES = [
  "open",
  "converted",
  "abandoned",
  "expired",
] as const;

export type WithdrawalIntentStatus = (typeof WITHDRAWAL_INTENT_STATUSES)[number];

export const WITHDRAWAL_RESERVATION_STATUSES = [
  "active",
  "released",
  "consumed",
] as const;

export type WithdrawalReservationStatus =
  (typeof WITHDRAWAL_RESERVATION_STATUSES)[number];

export const SETTLEMENT_BATCH_STATUSES = [
  "created",
  "processing",
  "completed",
  "failed",
  "reconciled",
] as const;

export type SettlementBatchStatus = (typeof SETTLEMENT_BATCH_STATUSES)[number];

/** Work-unit settlement lifecycle (Sprint 10) */
export const SETTLEMENT_STATUSES = [
  "pending",
  "scheduled",
  "processing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export const SETTLEMENT_POLICY_KEYS = [
  "immediate",
  "hold_period",
  "campaign_completion",
  "daily_batch",
  "weekly_batch",
  "manual_finance_approval",
] as const;

export type SettlementPolicyKey = (typeof SETTLEMENT_POLICY_KEYS)[number];

export const SETTLEMENT_TRANSITIONS: Record<
  SettlementStatus,
  readonly SettlementStatus[]
> = {
  pending: ["scheduled", "processing", "cancelled", "failed"],
  scheduled: ["processing", "cancelled", "failed"],
  processing: ["completed", "failed", "cancelled"],
  completed: [],
  failed: ["pending", "cancelled"],
  cancelled: [],
};

export const SETTLEMENT_BATCH_TRANSITIONS: Record<
  SettlementBatchStatus,
  readonly SettlementBatchStatus[]
> = {
  created: ["processing", "failed"],
  processing: ["completed", "failed"],
  completed: ["reconciled"],
  failed: ["created", "processing"],
  reconciled: [],
};

export const REFUND_STATUSES = [
  "requested",
  "processing",
  "processed",
  "failed",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];
