/**
 * Submission Package types.
 */

import type {
  ManifestEvidenceKind,
  SubmissionStatus,
} from "@/constants/work-states";
import type { EvidenceReference } from "@/lib/integrations/types";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";

export type SubmissionRecord = {
  id: string;
  publicId: string;
  assignmentId: string;
  workerUserId: string;
  status: SubmissionStatus;
  executionContextSnapshot: ExecutionContext;
  deviceSnapshot: Record<string, unknown> | null;
  gpsSnapshot: Record<string, unknown> | null;
  timingMetrics: Record<string, unknown> | null;
  readyAt: string | null;
  submittedAt: string | null;
  finalizedAt: string | null;
  closedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceManifestRecord = {
  id: string;
  submissionId: string;
  version: number;
  finalized: boolean;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceItemRecord = {
  id: string;
  manifestId: string;
  kind: ManifestEvidenceKind;
  label: string;
  stepKey: string | null;
  reference: EvidenceReference;
  contentHash: string | null;
  sizeBytes: number | null;
  inlinePayload: Record<string, unknown> | string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  replacedAt: string | null;
};

export type SubmissionSummaryRecord = {
  id: string;
  submissionId: string;
  timeSpentSeconds: number | null;
  completedSteps: number;
  requiredSteps: number;
  requiredCompleted: number;
  evidenceCounts: Record<string, number>;
  executionMetrics: Record<string, unknown>;
  workerNotesSummary: string | null;
  generatedAt: string;
};

export type SubmissionPackage = {
  submission: SubmissionRecord;
  manifest: EvidenceManifestRecord;
  items: EvidenceItemRecord[];
  summary: SubmissionSummaryRecord | null;
};
