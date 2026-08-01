/**
 * ReviewAssistant — Phase 4.1D AI Review Assistant.
 * Advisory only — never mutates business data.
 */

export type {
  ReviewAssistant,
  ReviewAssistantInput,
  ReviewAssistantResult,
} from "@/lib/ai/types";

export type {
  ReviewAssistance,
  ReviewContextBundle,
  ReviewRecommendation,
  ReviewChecklistItem,
  CampaignRuleCheck,
  ReviewerFeedbackKind,
} from "@/lib/ai/review/review-types";

export { buildEvidenceChecklist } from "@/lib/ai/review/evidence-checklist-builder";
export { evaluateCampaignRules } from "@/lib/ai/review/campaign-rule-evaluator";
export { buildReviewRecommendation } from "@/lib/ai/review/recommendation-builder";
export {
  buildReviewSummary,
  recommendationLabel,
} from "@/lib/ai/review/review-summary-builder";
export {
  recordReviewerFeedback,
  listReviewerFeedback,
  resetReviewerFeedbackForTests,
} from "@/lib/ai/review/reviewer-feedback";
export {
  reviewAssistant,
  reviewAssistantStub,
  assistReview,
} from "@/lib/ai/review/review-assistant";
export {
  getReviewAssistantTelemetrySnapshot,
  resetReviewAssistantTelemetryForTests,
  recordReviewAssistantTelemetry,
} from "@/lib/ai/review/review-telemetry";
export {
  isReviewAssistantEnabled,
  isReviewSummariesEnabled,
  isReviewFeedbackEnabled,
  shouldAugmentReviewWithAi,
  REVIEW_ASSISTANT_MODEL_VERSION,
} from "@/lib/ai/review/review-config";
