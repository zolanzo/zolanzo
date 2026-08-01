/**
 * Ranking-specific telemetry for Admin Ranking Health.
 */

import type { RankingHealthCounters } from "@/lib/ai/ranking/match-types";

const counters: RankingHealthCounters = {
  requests: 0,
  failures: 0,
  totalLatencyMs: 0,
  totalScore: 0,
  scoredWorkers: 0,
  fallbackCount: 0,
  aiAugmentCount: 0,
  lastLatencyMs: null,
  lastAt: null,
};

export function recordRankingTelemetry(event: {
  success: boolean;
  latencyMs: number;
  averageScore?: number;
  scoredWorkers?: number;
  fallbackUsed?: boolean;
  aiAugmented?: boolean;
}): void {
  counters.requests += 1;
  if (!event.success) counters.failures += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (event.averageScore != null && event.scoredWorkers) {
    counters.totalScore += event.averageScore * event.scoredWorkers;
    counters.scoredWorkers += event.scoredWorkers;
  }
  if (event.fallbackUsed) counters.fallbackCount += 1;
  if (event.aiAugmented) counters.aiAugmentCount += 1;
}

export function getRankingTelemetrySnapshot(): RankingHealthCounters & {
  averageScore: number;
  averageLatencyMs: number;
  fallbackRate: number;
} {
  return {
    ...counters,
    averageScore:
      counters.scoredWorkers > 0
        ? Math.round((counters.totalScore / counters.scoredWorkers) * 10) / 10
        : 0,
    averageLatencyMs:
      counters.requests > 0
        ? Math.round(counters.totalLatencyMs / counters.requests)
        : 0,
    fallbackRate:
      counters.requests > 0 ? counters.fallbackCount / counters.requests : 0,
  };
}

export function resetRankingTelemetryForTests(): void {
  counters.requests = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.totalScore = 0;
  counters.scoredWorkers = 0;
  counters.fallbackCount = 0;
  counters.aiAugmentCount = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
}
