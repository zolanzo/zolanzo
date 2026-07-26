/**
 * Validation Engine types.
 */

import type {
  ManifestEvidenceKind,
  ValidationProfileKey,
  ValidationReportStatus,
  ValidatorName,
  ValidatorResultStatus,
} from "@/constants/work-states";
import type { ValidationProfileDefinition } from "@/constants/validation-profiles";
import type { EvidenceReference } from "@/lib/integrations/types";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";
import type {
  EvidenceManifestRecord,
  SubmissionRecord,
  SubmissionSummaryRecord,
} from "@/features/submissions/types";

export type EvidenceSnapshotItem = {
  evidenceItemId: string;
  kind: ManifestEvidenceKind;
  label: string;
  stepKey: string | null;
  reference: EvidenceReference;
  contentHash: string | null;
  sizeBytes: number | null;
  inlinePayload: Record<string, unknown> | string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ValidatorResult = {
  validatorName: ValidatorName;
  status: ValidatorResultStatus;
  score: number | null;
  durationMs: number;
  messages: string[];
  metadata: Record<string, unknown> | null;
};

export type ValidationContext = {
  submission: SubmissionRecord;
  manifest: EvidenceManifestRecord;
  summary: SubmissionSummaryRecord | null;
  evidenceSnapshot: EvidenceSnapshotItem[];
  executionContext: ExecutionContext;
  profile: ValidationProfileDefinition;
};

export type AggregatedValidation = {
  overallStatus: ValidationReportStatus;
  overallScore: number;
  results: ValidatorResult[];
  warnings: string[];
  failures: string[];
  passedChecks: number;
  skippedChecks: number;
  durationMs: number;
};

export type ValidationReportRecord = {
  id: string;
  publicId: string;
  submissionId: string;
  profileKey: ValidationProfileKey;
  profileId: string | null;
  profileSnapshot: ValidationProfileDefinition;
  overallStatus: ValidationReportStatus;
  overallScore: number;
  warnings: string[];
  failures: string[];
  passedChecks: number;
  skippedChecks: number;
  durationMs: number;
  generatedAt: string;
  immutable: boolean;
};

export type ValidationResultRecord = {
  id: string;
  reportId: string;
  validatorName: ValidatorName;
  status: ValidatorResultStatus;
  score: number | null;
  durationMs: number;
  messages: string[];
  metadata: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: string;
};

export type ValidationEvidenceSnapshotRecord = {
  id: string;
  reportId: string;
  itemCount: number;
  items: EvidenceSnapshotItem[];
  capturedAt: string;
};

export type ValidationReportPackage = {
  report: ValidationReportRecord;
  results: ValidationResultRecord[];
  evidenceSnapshot: ValidationEvidenceSnapshotRecord;
};

export type Validator = {
  name: ValidatorName;
  validate: (ctx: ValidationContext) => ValidatorResult | Promise<ValidatorResult>;
};

export type {
  ReviewQueueItemRecord,
  ReviewDecisionRecord,
  ReviewFindingRecord,
  ReviewDecisionPackage,
  ReviewerWorkspace,
  EnqueueReviewResult,
  PolicyEvaluationResult,
} from "@/features/verification/types/review";
