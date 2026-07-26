/**
 * Journal templates — intended debit/credit postings per transaction type.
 * Implementation posts these as balanced LedgerJournal + LedgerEntry rows.
 * Amounts in minor units; fees handled as separate lines where noted.
 */

import type { LedgerAccountCode } from "@/constants/ledger";
import type { FinancialTransactionType } from "@/constants/transaction-types";

export type JournalLineTemplate = {
  side: "debit" | "credit";
  accountCode: LedgerAccountCode;
  /** Which amount field to use from the transaction */
  amountFrom: "amount" | "fee" | "net";
};

export type JournalTemplate = {
  transactionType: FinancialTransactionType;
  description: string;
  lines: readonly JournalLineTemplate[];
};

/**
 * Representative balanced templates (simplified chart).
 * Real implementation may split per-wallet sub-accounts.
 */
export const JOURNAL_TEMPLATES: readonly JournalTemplate[] = [
  {
    transactionType: "payment_capture",
    description: "Client tops up wallet via payment provider",
    lines: [
      { side: "debit", accountCode: "cash_clearing", amountFrom: "amount" },
      { side: "credit", accountCode: "client_liability", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "campaign_funding",
    description: "Move client funds toward campaign budget",
    lines: [
      { side: "debit", accountCode: "client_liability", amountFrom: "amount" },
      { side: "credit", accountCode: "client_funds", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "escrow_reserve",
    description: "Reserve funds into escrow for work units",
    lines: [
      { side: "debit", accountCode: "client_funds", amountFrom: "amount" },
      { side: "credit", accountCode: "escrow_liability", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "escrow_release",
    description: "Release escrow to worker on approval (+ optional platform fee)",
    lines: [
      { side: "debit", accountCode: "escrow_liability", amountFrom: "amount" },
      { side: "credit", accountCode: "worker_liability", amountFrom: "net" },
      { side: "credit", accountCode: "platform_fee_revenue", amountFrom: "fee" },
    ],
  },
  {
    transactionType: "escrow_refund",
    description: "Return escrow to client on reject/cancel",
    lines: [
      { side: "debit", accountCode: "escrow_liability", amountFrom: "amount" },
      { side: "credit", accountCode: "client_liability", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "withdrawal_request",
    description: "Lock worker balance for payout",
    lines: [
      { side: "debit", accountCode: "worker_liability", amountFrom: "amount" },
      { side: "credit", accountCode: "withdrawal_clearing", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "withdrawal_fee",
    description: "Platform withdrawal fee",
    lines: [
      { side: "debit", accountCode: "withdrawal_clearing", amountFrom: "fee" },
      { side: "credit", accountCode: "platform_fee_revenue", amountFrom: "fee" },
    ],
  },
  {
    transactionType: "withdrawal_settlement",
    description: "Settle net amount to external rail",
    lines: [
      { side: "debit", accountCode: "withdrawal_clearing", amountFrom: "net" },
      { side: "credit", accountCode: "cash_clearing", amountFrom: "net" },
    ],
  },
  {
    transactionType: "platform_fee",
    description: "Standalone platform fee capture",
    lines: [
      { side: "debit", accountCode: "client_liability", amountFrom: "fee" },
      { side: "credit", accountCode: "platform_fee_revenue", amountFrom: "fee" },
    ],
  },
  {
    transactionType: "referral_bonus",
    description: "Credit referral wallet/worker",
    lines: [
      { side: "debit", accountCode: "rewards_expense", amountFrom: "amount" },
      { side: "credit", accountCode: "referral_liability", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "reward",
    description: "Promotional or performance reward",
    lines: [
      { side: "debit", accountCode: "rewards_expense", amountFrom: "amount" },
      { side: "credit", accountCode: "worker_liability", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "refund",
    description: "Refund client payment",
    lines: [
      { side: "debit", accountCode: "client_liability", amountFrom: "amount" },
      { side: "credit", accountCode: "cash_clearing", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "manual_credit",
    description: "Admin manual credit (adjustment)",
    lines: [
      { side: "debit", accountCode: "adjustments", amountFrom: "amount" },
      { side: "credit", accountCode: "worker_liability", amountFrom: "amount" },
    ],
  },
  {
    transactionType: "manual_debit",
    description: "Admin manual debit (adjustment)",
    lines: [
      { side: "debit", accountCode: "worker_liability", amountFrom: "amount" },
      { side: "credit", accountCode: "adjustments", amountFrom: "amount" },
    ],
  },
] as const;

export function getJournalTemplate(
  type: FinancialTransactionType,
): JournalTemplate | undefined {
  return JOURNAL_TEMPLATES.find((t) => t.transactionType === type);
}
