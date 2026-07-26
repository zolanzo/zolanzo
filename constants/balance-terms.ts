/**
 * Standardized balance terminology for dashboards, reports, and support.
 * Never conflate these in UI or APIs.
 */

export const BALANCE_TERMS = {
  /** Money currently available to spend or withdraw (subject to holds/fees) */
  balance: "Balance",
  /** Money earned but not yet released from escrow */
  pendingBalance: "Pending Balance",
  /** Money reserved for active work (campaign/assignment escrow) */
  escrowBalance: "Escrow Balance",
  /** Cumulative approved earnings (worker) — never decreases on withdrawal */
  lifetimeEarnings: "Lifetime Earnings",
  /** Cumulative client spend — never decreases on refunds (refunds tracked separately) */
  lifetimeSpend: "Lifetime Spend",
  /** Withdrawable funds after holds, pending clearance, and fees */
  availableForWithdrawal: "Available for Withdrawal",
} as const;

export type BalanceTermKey = keyof typeof BALANCE_TERMS;

/**
 * Computed wallet view — projections, not source of truth.
 * Source of truth = ledger entries.
 */
export type WalletBalanceView = {
  currency: string;
  /** Available spendable/withdrawable before fee calc */
  balanceMinor: number;
  pendingBalanceMinor: number;
  escrowBalanceMinor: number;
  lifetimeEarningsMinor: number;
  lifetimeSpendMinor: number;
  availableForWithdrawalMinor: number;
  updatedAt: string;
};
