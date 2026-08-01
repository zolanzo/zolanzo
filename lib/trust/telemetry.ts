/**
 * Trust telemetry — Admin Trust Health panel.
 */

import type { TrustHealthCounters, TrustTrend } from "@/lib/trust/types";

const counters: TrustHealthCounters = {
  recalculations: 0,
  eventsProcessed: 0,
  eventsFailed: 0,
  eventsDeadLetter: 0,
  failures: 0,
  totalLatencyMs: 0,
  totalOverallScore: 0,
  scoredProfiles: 0,
  risingCount: 0,
  fallingCount: 0,
  newlyVerifiedIdentities: 0,
  lastLatencyMs: null,
  lastAt: null,
  scoreBuckets: {
    "0-19": 0,
    "20-49": 0,
    "50-74": 0,
    "75-89": 0,
    "90-100": 0,
  },
};

function bucketKey(score: number): string {
  if (score <= 19) return "0-19";
  if (score <= 49) return "20-49";
  if (score <= 74) return "50-74";
  if (score <= 89) return "75-89";
  return "90-100";
}

export function recordTrustRecalculation(event: {
  success: boolean;
  latencyMs: number;
  overallScore?: number;
  trend?: TrustTrend;
  identityNewlyVerified?: boolean;
}): void {
  counters.recalculations += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (!event.success) {
    counters.failures += 1;
    return;
  }
  if (event.overallScore != null) {
    counters.scoredProfiles += 1;
    counters.totalOverallScore += event.overallScore;
    const key = bucketKey(event.overallScore);
    counters.scoreBuckets[key] = (counters.scoreBuckets[key] ?? 0) + 1;
  }
  if (event.trend === "improving") counters.risingCount += 1;
  if (event.trend === "declining") counters.fallingCount += 1;
  if (event.identityNewlyVerified) counters.newlyVerifiedIdentities += 1;
}

export function recordTrustEventProcessed(count = 1): void {
  counters.eventsProcessed += count;
}

export function recordTrustEventFailed(count = 1): void {
  counters.eventsFailed += count;
}

export function recordTrustEventDeadLetter(count = 1): void {
  counters.eventsDeadLetter += count;
}

export function getTrustTelemetrySnapshot(): TrustHealthCounters & {
  averageScore: number;
  averageLatencyMs: number;
  errorRate: number;
  distribution: Record<string, number>;
  eventsPerHourEstimate: number;
} {
  return {
    ...counters,
    scoreBuckets: { ...counters.scoreBuckets },
    averageScore:
      counters.scoredProfiles > 0
        ? Math.round(
            (counters.totalOverallScore / counters.scoredProfiles) * 10,
          ) / 10
        : 0,
    averageLatencyMs:
      counters.recalculations > 0
        ? Math.round(counters.totalLatencyMs / counters.recalculations)
        : 0,
    errorRate:
      counters.recalculations > 0
        ? counters.failures / counters.recalculations
        : 0,
    distribution: { ...counters.scoreBuckets },
    eventsPerHourEstimate: counters.eventsProcessed,
  };
}

export function resetTrustTelemetryForTests(): void {
  counters.recalculations = 0;
  counters.eventsProcessed = 0;
  counters.eventsFailed = 0;
  counters.eventsDeadLetter = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.totalOverallScore = 0;
  counters.scoredProfiles = 0;
  counters.risingCount = 0;
  counters.fallingCount = 0;
  counters.newlyVerifiedIdentities = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.scoreBuckets = {
    "0-19": 0,
    "20-49": 0,
    "50-74": 0,
    "75-89": 0,
    "90-100": 0,
  };
}
