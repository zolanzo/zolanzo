import type { DataBoundary } from "@/lib/workspace/data-boundary";

export type HirerWalletSnapshot = {
  walletId: string | null;
  availableMinor: number;
  pendingMinor: number;
  heldMinor: number;
  lifetimePaidMinor: number;
  availableLabel: string;
  pendingLabel: string;
  heldLabel: string;
};

export type HirerLedgerRow = {
  id: string;
  title: string;
  amountMinor: number;
  type: string;
  status: string;
  createdAt: string;
};

export type HirerCampaignRow = {
  id: string;
  publicId: string;
  name: string;
  category: string;
  status: string;
  rewardPerUnitMinor: number;
  targetQuantity: number;
  completedQuantity: number;
  approvedQuantity: number;
  reservedBudgetMinor: number;
  spentBudgetMinor: number;
  createdAt: string;
};

export type HirerReviewRow = {
  id: string;
  publicId: string;
  status: string;
  submittedAt: string | null;
  workerName: string;
  workerAvatarUrl: string | null;
  campaignName: string;
  rewardLabel: string;
};

export type HirerWorkerRow = {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  assignmentCount: number;
};

export type HirerMemberRow = {
  userId: string;
  displayName: string;
  email: string | null;
  orgRole: string;
  status: string;
};

export type HirerInvitationRow = {
  id: string;
  email: string;
  orgRole: string;
  status: string;
};

export type HirerTemplateOption = {
  id: string;
  name: string;
  category: string;
  status: string;
};

export type HirerOrganization = {
  id: string;
  name: string;
  slug: string;
  publicId: string;
  kind: string;
  billingEmail: string;
};

export type HirerWorkspace = {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  organization: HirerOrganization | null;
  orgRole: string | null;
  wallet: HirerWalletSnapshot;
  transactions: HirerLedgerRow[];
  campaigns: HirerCampaignRow[];
  pendingReviews: HirerReviewRow[];
  workers: HirerWorkerRow[];
  members: HirerMemberRow[];
  invitations: HirerInvitationRow[];
  templates: HirerTemplateOption[];
  platformWorkerCount: number;
  loadState: DataBoundary;
};
