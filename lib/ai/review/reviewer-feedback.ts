/**
 * ReviewerFeedbackRecorder — store feedback for future evaluation only.
 * Never influences live recommendations in this slice.
 */

import { isReviewFeedbackEnabled } from "@/lib/ai/review/review-config";
import type {
  ReviewRecommendation,
  ReviewerFeedbackEntry,
  ReviewerFeedbackKind,
} from "@/lib/ai/review/review-types";
import { recordReviewFeedbackTelemetry } from "@/lib/ai/review/review-telemetry";

const feedbackLog: ReviewerFeedbackEntry[] = [];
const MAX = 500;

export function recordReviewerFeedback(params: {
  submissionId: string;
  assistanceModelVersion: string;
  recommendation: ReviewRecommendation;
  feedback: ReviewerFeedbackKind;
  reviewerUserId?: string | null;
  note?: string | null;
}): ReviewerFeedbackEntry | null {
  if (!isReviewFeedbackEnabled()) {
    return null;
  }

  const entry: ReviewerFeedbackEntry = {
    at: new Date().toISOString(),
    submissionId: params.submissionId,
    assistanceModelVersion: params.assistanceModelVersion,
    recommendation: params.recommendation,
    feedback: params.feedback,
    reviewerUserId: params.reviewerUserId ?? null,
    note: params.note ?? null,
  };

  feedbackLog.push(entry);
  if (feedbackLog.length > MAX) feedbackLog.shift();
  recordReviewFeedbackTelemetry(params.feedback);
  return entry;
}

export function listReviewerFeedback(limit = 50): ReviewerFeedbackEntry[] {
  return feedbackLog.slice(-limit).reverse();
}

export function resetReviewerFeedbackForTests(): void {
  feedbackLog.length = 0;
}
