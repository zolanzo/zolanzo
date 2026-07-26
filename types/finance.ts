/**
 * Financial domain conceptual models (design only — not Prisma).
 *
 * Rule: Campaign never credits Wallet directly.
 * Flow: Campaign → Escrow → Ledger → Wallet → Withdrawal → Settlement
 */

import type {
  AssignmentId,
  CampaignId,
  OrganizationId,
  UserId,
  WalletId,
} from "@/types/domain";
import type { WalletBalanceView } from "@/constants/balance-terms";
import type { WalletKind, WalletStatus } from "@/constants/wallet-kinds";
import type {
  JournalStatus,
  LedgerAccountCode,
  LedgerEntrySide,
  LedgerEntryStatus,
} from "@/constants/ledger";
import type {
  FinancialTransactionStatus,
  FinancialTransactionType,
} from "@/constants/transaction-types";
import type {
  FinanceEscrowStatus,
  RefundStatus,
  SettlementBatchStatus,
  WithdrawalMethod,
  WithdrawalStatus,
} from "@/constants/finance-enums";

export type CurrencyCode = string; // ISO 4217 — multi-currency future

export type LedgerAccountModel = {
  id: string;
  code: LedgerAccountCode;
  name: string;
  currency: CurrencyCode;
  ownerWalletId: WalletId | null;
  organizationId: OrganizationId | null;
};

export type WalletModel = {
  id: WalletId;
  kind: WalletKind;
  status: WalletStatus;
  currency: CurrencyCode;
  ownerUserId: UserId | null;
  organizationId: OrganizationId | null;
  /** Projection only — rebuildable from ledger */
  balances: WalletBalanceView;
  createdAt: string;
};

/**
 * Immutable journal header. Never deleted — reverse with a new journal.
 */
export type LedgerJournalModel = {
  id: string;
  idempotencyKey: string;
  transactionId: string;
  transactionType: FinancialTransactionType;
  status: JournalStatus;
  currency: CurrencyCode;
  memo: string | null;
  actorUserId: UserId | null;
  organizationId: OrganizationId | null;
  campaignId: CampaignId | null;
  assignmentId: AssignmentId | null;
  correlationId: string | null;
  createdAt: string;
  postedAt: string | null;
  reversedByJournalId: string | null;
};

/**
 * Single debit or credit line. Journals must balance (Σ debit == Σ credit).
 */
export type LedgerEntryModel = {
  id: string;
  journalId: string;
  accountCode: LedgerAccountCode;
  walletId: WalletId | null;
  side: LedgerEntrySide;
  amountMinor: number;
  currency: CurrencyCode;
  status: LedgerEntryStatus;
  createdAt: string;
};

export type FinancialTransactionModel = {
  id: string;
  type: FinancialTransactionType;
  status: FinancialTransactionStatus;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: CurrencyCode;
  idempotencyKey: string;
  sourceWalletId: WalletId | null;
  destinationWalletId: WalletId | null;
  campaignId: CampaignId | null;
  assignmentId: AssignmentId | null;
  organizationId: OrganizationId | null;
  externalRef: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type EscrowAccountModel = {
  id: string;
  campaignId: CampaignId;
  assignmentId: AssignmentId | null;
  currency: CurrencyCode;
  amountMinor: number;
  releasedMinor: number;
  refundedMinor: number;
  status: FinanceEscrowStatus;
  reservedAt: string;
  releasedAt: string | null;
  refundedAt: string | null;
  expiredAt: string | null;
};

export type PaymentModel = {
  id: string;
  clientWalletId: WalletId;
  organizationId: OrganizationId | null;
  provider: string;
  providerRef: string | null;
  amountMinor: number;
  currency: CurrencyCode;
  status: "initiated" | "succeeded" | "failed" | "refunded";
  campaignId: CampaignId | null;
  createdAt: string;
};

export type WithdrawalModel = {
  id: string;
  walletId: WalletId;
  workerId: UserId;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: CurrencyCode;
  destinationRef: string;
  settlementBatchId: string | null;
  requestedAt: string;
  completedAt: string | null;
  failureReason: string | null;
};

export type SettlementBatchModel = {
  id: string;
  method: WithdrawalMethod;
  status: SettlementBatchStatus;
  currency: CurrencyCode;
  totalMinor: number;
  itemCount: number;
  providerRef: string | null;
  openedAt: string;
  settledAt: string | null;
};

export type RefundModel = {
  id: string;
  paymentId: string | null;
  escrowId: string | null;
  transactionId: string;
  status: RefundStatus;
  amountMinor: number;
  currency: CurrencyCode;
  reason: string;
  createdAt: string;
  processedAt: string | null;
};

export type AdjustmentModel = {
  id: string;
  transactionId: string;
  walletId: WalletId;
  amountMinor: number;
  currency: CurrencyCode;
  direction: "credit" | "debit";
  reason: string;
  approvedBy: UserId;
  createdAt: string;
};

export type RewardModel = {
  id: string;
  walletId: WalletId;
  transactionId: string;
  kind: "reward" | "bonus" | "promotion" | "referral_bonus";
  amountMinor: number;
  currency: CurrencyCode;
  createdAt: string;
};

/**
 * Financial audit record — append-only.
 */
export type FinancialAuditModel = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorUserId: UserId | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
};

/**
 * Canonical money flow (never Campaign → Wallet direct).
 */
export const FINANCIAL_PIPELINE = [
  "client_funds_wallet",
  "campaign_funding",
  "escrow_reserve",
  "ledger_entries",
  "assignment_approval",
  "escrow_release",
  "worker_wallet",
  "withdrawal",
  "settlement",
] as const;

export type FinancialPipelineStage = (typeof FINANCIAL_PIPELINE)[number];
