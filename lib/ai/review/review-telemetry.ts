/**
 * Review Assistant telemetry — Admin Review Assistant Health.
 */

import type {
  ReviewAssistantHealthCounters,
  ReviewRecommendation,
  ReviewerFeedbackKind,
} from "@/lib/ai/review/review-types";

const counters: ReviewAssistantHealthCounters = {
  requests: 0,
  failures: 0,
  totalLatencyMs: 0,
  totalConfidence: 0,
  assisted: 0,
  aiAugmentCount: 0,
  ruleOnlyCount: 0,
  lastLatencyMs: null,
  lastAt: null,
  recommendationCounts: {
    approve: 0,
    reject: 0,
    request_revision: 0,
    escalate: 0,
  },
  feedbackHelpful: 0,
  feedbackNotHelpful: 0,
  feedbackIncorrect: 0,
};

export function recordReviewAssistantTelemetry(event: {
  success: boolean;
  latencyMs: number;
  confidence?: number;
  recommendation?: ReviewRecommendation;
  aiAugmented?: boolean;
}): void {
  counters.requests += 1;
  if (!event.success) counters.failures += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (event.success && event.recommendation) {
    counters.assisted += 1;
    counters.totalConfidence += event.confidence ?? 0;
    counters.recommendationCounts[event.recommendation] += 1;
    if (event.aiAugmented) counters.aiAugmentCount += 1;
    else counters.ruleOnlyCount += 1;
  }
}

export function recordReviewFeedbackTelemetry(
  feedback: ReviewerFeedbackKind,
): void {
  if (feedback === "helpful") counters.feedbackHelpful += 1;
  else if (feedback === "not_helpful") counters.feedbackNotHelpful += 1;
  else counters.feedbackIncorrect += 1;
}

export function getReviewAssistantTelemetrySnapshot(): ReviewAssistantHealthCounters & {
  averageConfidence: number;
  averageLatencyMs: number;
  reviewsAssistedToday: number;
  aiVsRuleRatio: number;
  feedbackTotal: number;
} {
  const feedbackTotal =
    counters.feedbackHelpful +
    counters.feedbackNotHelpful +
    counters.feedbackIncorrect;
  return {
    ...counters,
    recommendationCounts: { ...counters.recommendationCounts },
    averageConfidence:
      counters.assisted > 0
        ? Math.round((counters.totalConfidence / counters.assisted) * 100) /
          100
        : 0,
    averageLatencyMs:
      counters.requests > 0
        ? Math.round(counters.totalLatencyMs / counters.requests)
        : 0,
    reviewsAssistedToday: counters.assisted,
    aiVsRuleRatio:
      counters.assisted > 0 ? counters.aiAugmentCount / counters.assisted : 0,
    feedbackTotal,
  };
}

export function resetReviewAssistantTelemetryForTests(): void {
  counters.requests = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.totalConfidence = 0;
  counters.assisted = 0;
  counters.aiAugmentCount = 0;
  counters.ruleOnlyCount = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.recommendationCounts = {
    approve: 0,
    reject: 0,
    request_revision: 0,
    escalate: 0,
  };
  counters.feedbackHelpful = 0;
  counters.feedbackNotHelpful = 0;
  counters.feedbackIncorrect = 0;
}
