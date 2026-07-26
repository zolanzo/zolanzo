/**
 * Work Engine lifecycle states — kernel state machines.
 */

/** Campaign lifecycle — business contract states (Sprint 3) */
export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_review",
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
  "archived",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** Task Instance inventory lifecycle (Sprint 4) */
export const TASK_INSTANCE_STATUSES = [
  "generated",
  "available",
  "reserved",
  "claimed",
  "expired",
  "cancelled",
  "completed",
] as const;

export type TaskInstanceStatus = (typeof TASK_INSTANCE_STATUSES)[number];

/**
 * @deprecated Prefer TaskInstanceStatus — alias kept for conceptual TaskModel.
 */
export const TASK_STATUSES = TASK_INSTANCE_STATUSES;
export type TaskStatus = TaskInstanceStatus;

/** Assignment workspace + execution lifecycle (Sprint 6+) */
export const ASSIGNMENT_STATUSES = [
  "reserved",
  "assigned",
  /** @deprecated Prefer assigned — kept for Sprint 5 claim compatibility */
  "claimed",
  "started",
  "paused",
  "in_progress",
  "ready_for_submission",
  "submitted",
  "under_validation",
  "under_review",
  "revision_requested",
  "approved",
  "rejected",
  "escalated",
  "expired",
  "cancelled",
  "completed",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STEP_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "skipped",
  "failed",
] as const;

export type AssignmentStepStatus = (typeof ASSIGNMENT_STEP_STATUSES)[number];

export const ASSIGNMENT_TIMELINE_EVENTS = [
  "claimed",
  "started",
  "paused",
  "resumed",
  "step_started",
  "step_completed",
  "step_skipped",
  "step_failed",
  "evidence_attached",
  "note_added",
  "ready_for_submission",
  "submitted",
  "cancelled",
  "expired",
] as const;

export type AssignmentTimelineEventType =
  (typeof ASSIGNMENT_TIMELINE_EVENTS)[number];

/** Submission Package lifecycle (Sprint 7) */
export const SUBMISSION_STATUSES = [
  "draft",
  "ready",
  "submitted",
  "validating",
  "validation_complete",
  "in_review",
  "approved",
  "rejected",
  "revision_requested",
  "closed",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_TRANSITIONS: Record<
  SubmissionStatus,
  readonly SubmissionStatus[]
> = {
  draft: ["ready", "closed"],
  ready: ["draft", "submitted", "closed"],
  submitted: ["validating", "closed"],
  validating: ["validation_complete", "closed"],
  validation_complete: ["in_review", "approved", "rejected", "revision_requested", "closed"],
  in_review: ["approved", "rejected", "revision_requested", "closed"],
  approved: ["closed"],
  rejected: ["closed", "revision_requested"],
  revision_requested: ["draft", "closed"],
  closed: [],
};

/** Evidence kinds on the Submission Manifest */
export const MANIFEST_EVIDENCE_KINDS = [
  "image",
  "video",
  "audio",
  "file",
  "gps",
  "json",
  "link",
  "text",
  "screen_recording",
] as const;

export type ManifestEvidenceKind = (typeof MANIFEST_EVIDENCE_KINDS)[number];

/** @deprecated Prefer ValidationReportStatus — legacy pipeline states */
export const VALIDATION_STATUSES = [
  "pending",
  "running",
  "passed",
  "failed",
  "skipped",
  "needs_human",
] as const;

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

/** Per-validator outcome (Sprint 8) */
export const VALIDATOR_RESULT_STATUSES = [
  "pass",
  "warning",
  "fail",
  "skipped",
] as const;

export type ValidatorResultStatus = (typeof VALIDATOR_RESULT_STATUSES)[number];

/** Aggregated Validation Report overall status */
export const VALIDATION_REPORT_STATUSES = [
  "passed",
  "passed_with_warnings",
  "failed",
  "needs_human",
] as const;

export type ValidationReportStatus =
  (typeof VALIDATION_REPORT_STATUSES)[number];

/** Built-in validator names */
export const VALIDATOR_NAMES = [
  "manifest",
  "evidence",
  "step_completion",
  "timing",
  "rule",
  "execution_context",
  "file_reference",
  "gps",
  "device",
] as const;

export type ValidatorName = (typeof VALIDATOR_NAMES)[number];

/** Named validation profiles (select active validators) */
export const VALIDATION_PROFILE_KEYS = [
  "app_testing",
  "survey",
  "ai_labeling",
  "property_verification",
  "voice_recording",
  "translation",
] as const;

export type ValidationProfileKey = (typeof VALIDATION_PROFILE_KEYS)[number];

export const VALIDATION_MODES = [
  "ai",
  "automatic",
  "manual",
  "hybrid",
  "rule_based",
] as const;

export type ValidationMode = (typeof VALIDATION_MODES)[number];

/** @deprecated Prefer ReviewQueueStatus / ReviewDecisionOutcome */
export const REVIEW_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "revision_requested",
  "escalated",
] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Review queue item status */
export const REVIEW_QUEUE_STATUSES = [
  "pending",
  "assigned",
  "in_review",
  "completed",
  "escalated",
  "deferred",
] as const;

export type ReviewQueueStatus = (typeof REVIEW_QUEUE_STATUSES)[number];

/** Review case lifecycle */
export const REVIEW_LIFECYCLE_STATUSES = [
  "pending",
  "assigned",
  "in_review",
  "decision_recorded",
  "closed",
] as const;

export type ReviewLifecycleStatus = (typeof REVIEW_LIFECYCLE_STATUSES)[number];

/** Immutable decision outcomes */
export const REVIEW_DECISION_OUTCOMES = [
  "approved",
  "approved_with_warning",
  "revision_requested",
  "rejected",
  "escalated",
  "deferred",
] as const;

export type ReviewDecisionOutcome = (typeof REVIEW_DECISION_OUTCOMES)[number];

export const REVIEW_MODES = [
  "automatic",
  "human",
  "ai_assisted",
  "two_person",
  "consensus",
  "escalation",
  "customer_future",
] as const;

export type ReviewMode = (typeof REVIEW_MODES)[number];

export const REVIEW_FINDING_SEVERITIES = [
  "info",
  "warning",
  "major",
  "critical",
] as const;

export type ReviewFindingSeverity = (typeof REVIEW_FINDING_SEVERITIES)[number];

export const REVIEW_FINDING_CATEGORIES = [
  "missing_evidence",
  "gps_mismatch",
  "blurry_image",
  "rule_violation",
  "wrong_language",
  "incomplete_checklist",
  "quality",
  "other",
] as const;

export type ReviewFindingCategory = (typeof REVIEW_FINDING_CATEGORIES)[number];

export const REVIEW_POLICY_KEYS = [
  "auto_approve_high_score",
  "always_human",
  "random_audit",
  "two_reviewers",
  "senior_after_rejection",
  "customer_before_approval",
  "escalate_high_value",
] as const;

export type ReviewPolicyKey = (typeof REVIEW_POLICY_KEYS)[number];

export const REVIEW_QUEUE_TRANSITIONS: Record<
  ReviewQueueStatus,
  readonly ReviewQueueStatus[]
> = {
  pending: ["assigned", "in_review", "completed", "escalated", "deferred"],
  assigned: ["in_review", "pending", "escalated", "deferred"],
  in_review: ["completed", "escalated", "deferred"],
  completed: [],
  escalated: ["assigned", "in_review", "completed", "deferred"],
  deferred: ["pending", "assigned", "escalated"],
};

/** Escrow ledger state */
export const ESCROW_STATUSES = [
  "reserved",
  "held",
  "released",
  "refunded",
  "partially_released",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

/** Terminal completion of an assignment unit of work */
export const COMPLETION_STATUSES = [
  "success",
  "failed",
  "cancelled",
  "expired",
] as const;

export type CompletionStatus = (typeof COMPLETION_STATUSES)[number];

/** Allowed assignment transitions (workspace + review pipeline) */
export const ASSIGNMENT_TRANSITIONS: Record<
  AssignmentStatus,
  readonly AssignmentStatus[]
> = {
  reserved: ["assigned", "claimed", "cancelled", "expired"],
  assigned: ["started", "cancelled", "expired"],
  claimed: ["started", "cancelled", "expired"],
  started: ["in_progress", "paused", "ready_for_submission", "cancelled", "expired"],
  paused: ["in_progress", "started", "cancelled", "expired"],
  in_progress: [
    "paused",
    "ready_for_submission",
    "cancelled",
    "expired",
  ],
  ready_for_submission: ["submitted", "in_progress", "cancelled", "expired"],
  submitted: ["under_validation", "cancelled"],
  under_validation: ["under_review", "revision_requested", "rejected", "approved"],
  under_review: [
    "approved",
    "rejected",
    "revision_requested",
    "escalated",
  ],
  revision_requested: ["started", "in_progress", "submitted", "cancelled", "expired"],
  approved: ["completed"],
  rejected: ["completed"],
  escalated: ["under_review", "approved", "rejected", "cancelled"],
  expired: [],
  cancelled: [],
  completed: [],
};
