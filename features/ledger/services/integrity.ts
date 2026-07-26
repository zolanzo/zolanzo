/**
 * Ledger integrity helpers — pure functions (no DB).
 */

import type { LedgerEntrySide } from "@/constants/ledger";

export type LedgerLineInput = {
  accountCode: string;
  side: LedgerEntrySide;
  amountMinor: number;
  walletId?: string | null;
};

export function assertBalancedJournal(lines: readonly LedgerLineInput[]): void {
  if (lines.length < 2) {
    throw new Error("Journal requires at least two lines");
  }
  let debit = 0;
  let credit = 0;
  for (const line of lines) {
    if (line.amountMinor < 0) {
      throw new Error("Ledger amounts must be non-negative");
    }
    if (line.amountMinor === 0) continue;
    if (line.side === "debit") debit += line.amountMinor;
    else credit += line.amountMinor;
  }
  if (debit !== credit) {
    throw new Error(`Unbalanced journal: debit=${debit} credit=${credit}`);
  }
  if (debit === 0) {
    throw new Error("Journal has zero total");
  }
}

export function sumSide(
  lines: readonly LedgerLineInput[],
  side: LedgerEntrySide,
): number {
  return lines
    .filter((l) => l.side === side)
    .reduce((acc, l) => acc + l.amountMinor, 0);
}

/** Resolve template amount fields into concrete lines (skip zero fee lines). */
export function expandTemplateLines(params: {
  lines: readonly {
    side: LedgerEntrySide;
    accountCode: string;
    amountFrom: "amount" | "fee" | "net";
  }[];
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  workerWalletId?: string | null;
}): LedgerLineInput[] {
  const amounts = {
    amount: params.amountMinor,
    fee: params.feeMinor,
    net: params.netMinor,
  };
  const result: LedgerLineInput[] = [];
  for (const line of params.lines) {
    const amountMinor = amounts[line.amountFrom];
    if (amountMinor <= 0) continue;
    result.push({
      accountCode: line.accountCode,
      side: line.side,
      amountMinor,
      walletId:
        line.accountCode === "worker_liability" ||
        line.accountCode === "withdrawal_clearing"
          ? (params.workerWalletId ?? null)
          : null,
    });
  }
  return result;
}
