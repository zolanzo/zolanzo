/**
 * Phase 4.1D — AI Review Assistant types.
 * Advisory only — never approves, rejects, or mutates domain state.
 */

export type ReviewRecommendation =
  | "approve"
  | "reject"
  | "request_revision"
  | "escalate";

export type ReviewChecklistItemStatus = "pass" | "fail" | "warning" | "skipped";

export type ReviewChecklistItem = {
  code: string;
  label: string;
  status: ReviewChecklistItemStatus;
  detail?: string;
};

export type CampaignRuleCheck = {
  ruleId: string;
  label: string;
  status: "pass" | "fail" | "warning" | "not_applicable";
  detail?: string;
};

export type ReviewContextBundle = {
  submissionId: string;
  submissionPublicId: string | null;
  organizationId: string | null;
  campaignId: string | null;
  campaignName: string | null;
  workerUserId: string;
  status: string;
  /** Required evidence kinds from template / campaign */
  requiredEvidenceKinds: string[];
  evidenceItems: Array<{
    id: string;
    kind: string;
    label: string;
    contentHash: string | null;
    sizeBytes: number | null;
    replacedAt: string | null;
  }>;
  /** Required form/metadata keys expected present */
  requiredFormFields: string[];
  presentFormFields: string[];
  gpsPresent: boolean;
  gpsWithinBoundary: boolean | null;
  identityVerified: boolean;
  fraudRiskScore: number;
  fraudRiskLevel: "low" | "medium" | "high" | "critical";
  fraudReasons: string[];
  fraudWarnings: string[];
  /** Worker historical approval rate 0–1 */
  workerApprovalRate: number;
  workerCompletedTasks: number;
  similarSubmissionDetected: boolean;
  similarSubmissionNote: string | null;
  /** Campaign-specific rule definitions */
  campaignRules: Array<{
    id: string;
    kind:
      | "required_photo_count"
      | "gps_radius_m"
      | "manager_approval"
      | "required_kinds"
      | "custom";
    label: string;
    params: Record<string, unknown>;
  }>;
  narrativeText: string | null;
};

export type ReviewAssistance = {
  submissionId: string;
  recommendation: ReviewRecommendation;
  confidence: number;
  /** Short executive bullets */
  summary: string[];
  reasons: string[];
  warnings: string[];
  missingItems: string[];
  suggestedActions: string[];
  alternativeAction: string | null;
  checklist: ReviewChecklistItem[];
  campaignRuleChecks: CampaignRuleCheck[];
  fraudRiskScore: number;
  fraudRiskLevel: string;
  aiAugmented: boolean;
  fallbackUsed: boolean;
  advisoryOnly: true;
  modelVersion: string;
  latencyMs: number;
};

export type ReviewerFeedbackKind = "helpful" | "not_helpful" | "incorrect";

export type ReviewerFeedbackEntry = {
  at: string;
  submissionId: string;
  assistanceModelVersion: string;
  recommendation: ReviewRecommendation;
  feedback: ReviewerFeedbackKind;
  reviewerUserId: string | null;
  note: string | null;
};

export type ReviewAssistantHealthCounters = {
  requests: number;
  failures: number;
  totalLatencyMs: number;
  totalConfidence: number;
  assisted: number;
  aiAugmentCount: number;
  ruleOnlyCount: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  recommendationCounts: Record<ReviewRecommendation, number>;
  feedbackHelpful: number;
  feedbackNotHelpful: number;
  feedbackIncorrect: number;
};

export const REVIEW_ASSISTANT_MODEL_VERSION = "review-assistant/1.0.0";
