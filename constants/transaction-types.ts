/**
 * Financial transaction type catalog.
 * Each type maps to a journal template (debits/credits) at implementation time.
 */

export const FINANCIAL_TRANSACTION_TYPES = [
  "campaign_funding",
  "escrow_reserve",
  "escrow_release",
  "escrow_refund",
  "escrow_partial_release",
  "withdrawal_request",
  "withdrawal_fee",
  "withdrawal_settlement",
  "referral_bonus",
  "referral_commission",
  "platform_fee",
  "adjustment",
  "refund",
  "manual_credit",
  "manual_debit",
  "reward",
  "bonus",
  "promotion",
  "payment_capture",
  "payment_failed",
  "settlement_batch",
] as const;

export type FinancialTransactionType =
  (typeof FINANCIAL_TRANSACTION_TYPES)[number];

export const FINANCIAL_TRANSACTION_TYPE_LABELS: Record<
  FinancialTransactionType,
  string
> = {
  campaign_funding: "Campaign Funding",
  escrow_reserve: "Escrow Reserve",
  escrow_release: "Escrow Release",
  escrow_refund: "Escrow Refund",
  escrow_partial_release: "Escrow Partial Release",
  withdrawal_request: "Withdrawal Request",
  withdrawal_fee: "Withdrawal Fee",
  withdrawal_settlement: "Withdrawal Settlement",
  referral_bonus: "Referral Bonus",
  referral_commission: "Referral Commission",
  platform_fee: "Platform Fee",
  adjustment: "Adjustment",
  refund: "Refund",
  manual_credit: "Manual Credit",
  manual_debit: "Manual Debit",
  reward: "Reward",
  bonus: "Bonus",
  promotion: "Promotion",
  payment_capture: "Payment Capture",
  payment_failed: "Payment Failed",
  settlement_batch: "Settlement Batch",
};

export const FINANCIAL_TRANSACTION_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "reversed",
] as const;

export type FinancialTransactionStatus =
  (typeof FINANCIAL_TRANSACTION_STATUSES)[number];
