/**
 * Double-entry ledger primitives.
 * Every money movement = balanced journal (debits == credits).
 */

export const LEDGER_ENTRY_SIDES = ["debit", "credit"] as const;
export type LedgerEntrySide = (typeof LEDGER_ENTRY_SIDES)[number];

export const LEDGER_ENTRY_STATUSES = [
  "pending",
  "completed",
  "failed",
  "reversed",
  "expired",
] as const;

export type LedgerEntryStatus = (typeof LEDGER_ENTRY_STATUSES)[number];

/**
 * Chart of accounts (logical). Physical table may use account codes.
 * Expand later for tax, FX clearing, etc.
 */
export const LEDGER_ACCOUNT_CODES = [
  // Asset-like (platform custody)
  "cash_clearing",
  "client_funds",
  "org_funds",
  "worker_payable",
  "escrow_asset",
  "withdrawal_clearing",
  // Liability-like
  "client_liability",
  "org_liability",
  "worker_liability",
  "escrow_liability",
  "referral_liability",
  "platform_revenue",
  "platform_fee_revenue",
  // Contra / adjustment
  "refunds_payable",
  "adjustments",
  "rewards_expense",
  "fx_clearing",
] as const;

export type LedgerAccountCode = (typeof LEDGER_ACCOUNT_CODES)[number];

export const JOURNAL_STATUSES = [
  "pending",
  "posted",
  "failed",
  "reversed",
] as const;

export type JournalStatus = (typeof JOURNAL_STATUSES)[number];
