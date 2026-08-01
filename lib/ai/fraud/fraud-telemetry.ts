/**
 * Fraud telemetry — Admin Fraud Health counters.
 */

import type { FraudHealthCounters } from "@/lib/ai/fraud/fraud-types";

const counters: FraudHealthCounters = {
  requests: 0,
  failures: 0,
  totalLatencyMs: 0,
  totalScore: 0,
  assessments: 0,
  highRiskCount: 0,
  aiAugmentCount: 0,
  ruleOnlyCount: 0,
  lastLatencyMs: null,
  lastAt: null,
  falsePositiveReviews: 0,
  confirmedFraudReviews: 0,
};

export function recordFraudTelemetry(event: {
  success: boolean;
  latencyMs: number;
  riskScore?: number;
  highRisk?: boolean;
  aiAugmented?: boolean;
}): void {
  counters.requests += 1;
  if (!event.success) counters.failures += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (event.success && event.riskScore != null) {
    counters.assessments += 1;
    counters.totalScore += event.riskScore;
    if (event.highRisk) counters.highRiskCount += 1;
    if (event.aiAugmented) counters.aiAugmentCount += 1;
    else counters.ruleOnlyCount += 1;
  }
}

/** Reserved for future reviewer feedback loop (isolated from decisions). */
export function recordFraudReviewFeedback(outcome: {
  falsePositive?: boolean;
  confirmedFraud?: boolean;
}): void {
  if (outcome.falsePositive) counters.falsePositiveReviews += 1;
  if (outcome.confirmedFraud) counters.confirmedFraudReviews += 1;
}

export function getFraudTelemetrySnapshot(): FraudHealthCounters & {
  averageScore: number;
  averageLatencyMs: number;
  assessmentsToday: number;
  aiVsRuleRatio: number;
  falsePositiveReviewRate: number | null;
} {
  const feedbackTotal =
    counters.falsePositiveReviews + counters.confirmedFraudReviews;
  return {
    ...counters,
    averageScore:
      counters.assessments > 0
        ? Math.round((counters.totalScore / counters.assessments) * 10) / 10
        : 0,
    averageLatencyMs:
      counters.requests > 0
        ? Math.round(counters.totalLatencyMs / counters.requests)
        : 0,
    assessmentsToday: counters.assessments,
    aiVsRuleRatio:
      counters.assessments > 0
        ? counters.aiAugmentCount / counters.assessments
        : 0,
    falsePositiveReviewRate:
      feedbackTotal > 0
        ? counters.falsePositiveReviews / feedbackTotal
        : null,
  };
}

export function resetFraudTelemetryForTests(): void {
  counters.requests = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.totalScore = 0;
  counters.assessments = 0;
  counters.highRiskCount = 0;
  counters.aiAugmentCount = 0;
  counters.ruleOnlyCount = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.falsePositiveReviews = 0;
  counters.confirmedFraudReviews = 0;
}
