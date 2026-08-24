import type { OpportunityPreferences } from "@/features/settings/types";
import type { WorkOpportunity } from "@/features/task-marketplace/types";
import type { DataBoundary } from "@/lib/workspace/data-boundary";

export type MaskedBankAccount = {
  id: string;
  label: string;
  verified: boolean;
  last4: string | null;
  bankName: string | null;
};

export type WalletSnapshot = {
  walletId: string | null;
  availableMinor: number;
  pendingMinor: number;
  heldMinor: number;
  lifetimeEarnedMinor: number;
  lifetimePaidMinor: number;
  availableLabel: string;
  pendingLabel: string;
};

export type LedgerRow = {
  id: string;
  title: string;
  amountMinor: number;
  type: string;
  status: string;
  createdAt: string;
};

export type WithdrawalRow = {
  id: string;
  publicId: string;
  amountMinor: number;
  status: string;
  createdAt: string;
};

export type WorkerStats = {
  completedAssignments: number;
  totalAssignments: number;
  approvedSubmissions: number;
  totalSubmissions: number;
  approvalRate: number | null;
  completionRate: number | null;
};

export type VerificationFlags = {
  email: boolean;
  phone: boolean;
  bank: boolean;
  identity: boolean;
};

export type EarnerWorkspace = {
  userId: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  memberSince: string;
  workerPublicId: string | null;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  legalName: string | null;
  bio: string | null;
  countryCode: string | null;
  trustScore: number | null;
  wallet: WalletSnapshot;
  bank: MaskedBankAccount | null;
  transactions: LedgerRow[];
  withdrawals: WithdrawalRow[];
  opportunities: WorkOpportunity[];
  stats: WorkerStats;
  verification: VerificationFlags;
  preferences: OpportunityPreferences;
  marketingOptIn: boolean;
  referralUrl: string;
  workItems: EarnerWorkItem[];
  loadState: DataBoundary;
};

export type EarnerWorkItem = {
  id: string;
  assignmentPublicId: string;
  instancePublicId: string;
  title: string;
  assignmentStatus: string;
  submissionStatus: string | null;
  rewardMinor: number;
  submittedAt: string | null;
  createdAt: string;
};
