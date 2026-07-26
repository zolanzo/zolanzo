/**
 * Work Engine conceptual models (design only — not Prisma).
 * Kernel: Campaign → Template → Task → Assignment → Submission → …
 */

import type {
  AssignmentId,
  CampaignId,
  OrganizationId,
  SubmissionId,
  TaskId,
  UserId,
  WalletId,
} from "@/types/domain";
import type { TaskTemplateId } from "@/constants/task-templates";
import type { EvidenceKind } from "@/constants/work-capabilities";
import type {
  AssignmentStatus,
  CampaignStatus,
  CompletionStatus,
  EscrowStatus,
  ReviewStatus,
  SubmissionStatus,
  TaskStatus,
  ValidationMode,
  ValidationStatus,
} from "@/constants/work-states";

/**
 * Conceptual campaign shape (design). Production model: Prisma `Campaign`
 * + `features/campaigns` — business contract, not a task bag.
 */
export type CampaignModel = {
  id: CampaignId;
  organizationId: OrganizationId | null;
  clientUserId: UserId | null;
  /** Catalog category (campaign-types registry) — optional UX catalog */
  typeId: string;
  /** HOW work is done (task-templates registry / DB id) */
  templateId: TaskTemplateId;
  title: string;
  status: CampaignStatus;
  targetUnits: number;
  rewardMinor: number;
  currency: string;
  escrowWalletId: WalletId | null;
  createdAt: string;
};

/**
 * Conceptual Task Instance (design). Production: Prisma `TaskInstance`
 * + `features/tasks` — marketplace inventory, not an Assignment.
 */
export type TaskModel = {
  id: TaskId;
  campaignId: CampaignId;
  templateId: TaskTemplateId;
  /** Sequence within campaign (1..n) */
  unitKey: string;
  status: TaskStatus;
  payloadRef: string | null;
  openedAt: string | null;
  expiresAt: string | null;
};

export type AssignmentModel = {
  id: AssignmentId;
  taskId: TaskId;
  campaignId: CampaignId;
  workerId: UserId;
  status: AssignmentStatus;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  gps: { lat: number; lng: number; accuracyM?: number } | null;
  device: Record<string, string> | null;
  evidenceSummary: string | null;
};

export type SubmissionEvidenceItem = {
  kind: EvidenceKind;
  /** Storage path, URL, or inline ref */
  ref: string;
  stepKey: string;
  meta?: Record<string, unknown>;
};

export type SubmissionModel = {
  id: SubmissionId;
  assignmentId: AssignmentId;
  workerId: UserId;
  status: SubmissionStatus;
  evidence: SubmissionEvidenceItem[];
  textPayload: string | null;
  jsonPayload: Record<string, unknown> | null;
  createdAt: string;
  submittedAt: string | null;
};

export type ValidationModel = {
  id: string;
  submissionId: SubmissionId;
  mode: ValidationMode;
  status: ValidationStatus;
  score: number | null;
  findings: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type ReviewModel = {
  id: string;
  submissionId: SubmissionId;
  assignmentId: AssignmentId;
  reviewerId: UserId | null;
  status: ReviewStatus;
  notes: string | null;
  decidedAt: string | null;
};

export type EscrowHoldModel = {
  id: string;
  campaignId: CampaignId;
  assignmentId: AssignmentId | null;
  amountMinor: number;
  currency: string;
  status: EscrowStatus;
  reservedAt: string;
  releasedAt: string | null;
  refundedAt: string | null;
  /**
   * Work-engine view of escrow.
   * Money movement MUST post through the Financial Ledger
   * (`types/finance.ts` · `features/ledger`) — never Campaign → Wallet direct.
   */
  ledgerTransactionId: string | null;
};

export type CompletionModel = {
  id: string;
  assignmentId: AssignmentId;
  status: CompletionStatus;
  walletCreditId: string | null;
  analyticsEmitted: boolean;
  completedAt: string;
};

/**
 * Universal pipeline stages (OS kernel order).
 */
export const WORK_ENGINE_PIPELINE = [
  "client",
  "campaign",
  "task_template",
  "task",
  "marketplace",
  "worker_claim",
  "assignment",
  "submission",
  "validation",
  "review",
  "approval",
  "escrow",
  "wallet",
  "analytics",
  "completion",
] as const;

export type WorkEngineStage = (typeof WORK_ENGINE_PIPELINE)[number];
