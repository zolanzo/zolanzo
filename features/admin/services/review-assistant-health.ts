/**
 * Admin Review Assistant Health.
 */

import "server-only";

import {
  isReviewAssistantEnabled,
  isReviewSummariesEnabled,
  isReviewFeedbackEnabled,
  shouldAugmentReviewWithAi,
  REVIEW_ASSISTANT_MODEL_VERSION,
} from "@/lib/ai/review/review-config";
import { getReviewAssistantTelemetrySnapshot } from "@/lib/ai/review/review-telemetry";
import { isAiEnabled } from "@/lib/ai/config";

export type ReviewAssistantHealthSnapshot = {
  reviewAssistantEnabled: boolean;
  summariesEnabled: boolean;
  feedbackEnabled: boolean;
  aiEnabled: boolean;
  aiAugmentEnabled: boolean;
  modelVersion: string;
  reviewsAssistedToday: number;
  averageConfidence: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  recommendationDistribution: Record<string, number>;
  aiAugmentedCount: number;
  ruleOnlyCount: number;
  aiVsRuleRatio: number;
  feedbackHelpful: number;
  feedbackNotHelpful: number;
  feedbackIncorrect: number;
  feedbackTotal: number;
  failures: number;
  requests: number;
  generatedAt: string;
};

export async function getReviewAssistantHealthSnapshot(): Promise<ReviewAssistantHealthSnapshot> {
  const telemetry = getReviewAssistantTelemetrySnapshot();
  return {
    reviewAssistantEnabled: isReviewAssistantEnabled(),
    summariesEnabled: isReviewSummariesEnabled(),
    feedbackEnabled: isReviewFeedbackEnabled(),
    aiEnabled: isAiEnabled(),
    aiAugmentEnabled: shouldAugmentReviewWithAi(),
    modelVersion: REVIEW_ASSISTANT_MODEL_VERSION,
    reviewsAssistedToday: telemetry.reviewsAssistedToday,
    averageConfidence: telemetry.averageConfidence,
    averageLatencyMs: telemetry.averageLatencyMs,
    lastLatencyMs: telemetry.lastLatencyMs,
    recommendationDistribution: telemetry.recommendationCounts,
    aiAugmentedCount: telemetry.aiAugmentCount,
    ruleOnlyCount: telemetry.ruleOnlyCount,
    aiVsRuleRatio: telemetry.aiVsRuleRatio,
    feedbackHelpful: telemetry.feedbackHelpful,
    feedbackNotHelpful: telemetry.feedbackNotHelpful,
    feedbackIncorrect: telemetry.feedbackIncorrect,
    feedbackTotal: telemetry.feedbackTotal,
    failures: telemetry.failures,
    requests: telemetry.requests,
    generatedAt: new Date().toISOString(),
  };
}
