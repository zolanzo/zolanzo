/**
 * @module features/verification/services
 */

export { runValidationPipeline } from "@/features/verification/services/pipeline";
export { aggregateValidatorResults } from "@/features/verification/services/aggregation";
export { captureEvidenceSnapshot } from "@/features/verification/services/evidence-snapshot";
export {
  runValidation,
  getValidationReport,
  listValidationReports,
} from "@/features/verification/services/validation-service";
export { BUILTIN_VALIDATORS, getValidator } from "@/features/verification/services/validators";
export {
  enqueueForReview,
  claimQueueItem,
  startReview,
  recordReviewDecision,
  getReviewDecision,
  listReviewQueue,
} from "@/features/verification/services/review-service";
export { getReviewerWorkspace } from "@/features/verification/services/review-workspace";
export { evaluateReviewPolicy } from "@/features/verification/services/review-policy-engine";
export {
  canTransitionReviewQueue,
  assertReviewQueueTransition,
  mapOutcomeToSubmissionStatus,
} from "@/features/verification/services/review-lifecycle";
