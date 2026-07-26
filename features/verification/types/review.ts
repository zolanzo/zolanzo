/**
 * Review Engine types.
 */

import type {
  ReviewDecisionOutcome,
  ReviewFindingCategory,
  ReviewFindingSeverity,
  ReviewLifecycleStatus,
  ReviewMode,
  ReviewPolicyKey,
  ReviewQueueStatus,
} from "@/constants/work-states";
import type { ReviewPolicyDefinition } from "@/constants/review-policies";
import type { AssignmentRecord, AssignmentTimelineRecord } from "@/features/assignments/types";
import type { SubmissionPackage, SubmissionSummaryRecord } from "@/features/submissions/types";
import type {
  EvidenceSnapshotItem,
  ValidationReportPackage,
} from "@/features/verification/types";

export type ReviewQueueItemRecord = {
  id: string;
  submissionId: string;
  validationReportId: string;
  policyKey: ReviewPolicyKey;
  policyId: string | null;
  policySnapshot: ReviewPolicyDefinition;
  status: ReviewQueueStatus;
  lifecycleStatus: ReviewLifecycleStatus;
  priority: number;
  assignedReviewerId: string | null;
  claimedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewAssignmentRecord = {
  id: string;
  queueItemId: string;
  reviewerUserId: string;
  role: string;
  assignedAt: string;
  releasedAt: string | null;
  metadata: Record<string, unknown> | null;
};

export type ReviewFindingInput = {
  category: ReviewFindingCategory;
  severity: ReviewFindingSeverity;
  assignmentStepKey?: string | null;
  evidenceItemId?: string | null;
  validatorResultId?: string | null;
  message: string;
  recommendation?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ReviewFindingRecord = {
  id: string;
  decisionId: string;
  category: ReviewFindingCategory;
  severity: ReviewFindingSeverity;
  assignmentStepKey: string | null;
  evidenceItemId: string | null;
  validatorResultId: string | null;
  message: string;
  recommendation: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type ReviewDecisionRecord = {
  id: string;
  publicId: string;
  submissionId: string;
  validationReportId: string;
  queueItemId: string;
  reviewerUserId: string | null;
  reviewMode: ReviewMode;
  outcome: ReviewDecisionOutcome;
  confidence: number | null;
  durationMs: number | null;
  decidedAt: string;
  comments: string | null;
  requestedRevisions: Record<string, unknown> | string[] | null;
  policySnapshot: ReviewPolicyDefinition;
  metadata: Record<string, unknown> | null;
  immutable: boolean;
  createdAt: string;
};

export type ReviewDecisionPackage = {
  decision: ReviewDecisionRecord;
  findings: ReviewFindingRecord[];
};

export type PolicyEvaluationResult = {
  action:
    | "auto_approve"
    | "auto_reject"
    | "enqueue_human"
    | "enqueue_escalated"
    | "defer";
  reason: string;
  outcome?: ReviewDecisionOutcome;
};

export type ReviewerWorkspace = {
  queueItem: ReviewQueueItemRecord;
  submission: SubmissionPackage;
  validationReport: ValidationReportPackage;
  evidenceSnapshot: EvidenceSnapshotItem[];
  assignment: AssignmentRecord;
  timeline: AssignmentTimelineRecord[];
  summary: SubmissionSummaryRecord | null;
  priorFindings: ReviewFindingRecord[];
  priorDecisions: ReviewDecisionRecord[];
};

export type EnqueueReviewResult = {
  queueItem: ReviewQueueItemRecord;
  autoDecision: ReviewDecisionPackage | null;
  policyEvaluation: PolicyEvaluationResult;
};
