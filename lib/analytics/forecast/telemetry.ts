/**
 * Forecast telemetry — Admin Forecast Health.
 */

import type { ForecastHealthCounters } from "@/lib/analytics/forecast/types";

const counters: ForecastHealthCounters = {
  jobs: 0,
  cacheHits: 0,
  cacheMisses: 0,
  failures: 0,
  totalLatencyMs: 0,
  lastLatencyMs: null,
  lastAt: null,
  byType: {},
  confidenceBuckets: {
    "0-44": 0,
    "45-69": 0,
    "70-100": 0,
  },
};

function bucket(confidence: number): string {
  if (confidence < 45) return "0-44";
  if (confidence < 70) return "45-69";
  return "70-100";
}

export function recordForecastJob(event: {
  type: string;
  success: boolean;
  cacheHit: boolean;
  latencyMs: number;
  confidence?: number;
}): void {
  counters.jobs += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  counters.byType[event.type] = (counters.byType[event.type] ?? 0) + 1;
  if (event.cacheHit) counters.cacheHits += 1;
  else counters.cacheMisses += 1;
  if (!event.success) {
    counters.failures += 1;
    return;
  }
  if (event.confidence != null) {
    const key = bucket(event.confidence);
    counters.confidenceBuckets[key] =
      (counters.confidenceBuckets[key] ?? 0) + 1;
  }
}

export function getForecastTelemetrySnapshot(): ForecastHealthCounters & {
  averageLatencyMs: number;
  cacheHitRate: number;
  errorRate: number;
} {
  const attempts = counters.cacheHits + counters.cacheMisses;
  return {
    ...counters,
    byType: { ...counters.byType },
    confidenceBuckets: { ...counters.confidenceBuckets },
    averageLatencyMs:
      counters.jobs > 0
        ? Math.round(counters.totalLatencyMs / counters.jobs)
        : 0,
    cacheHitRate: attempts > 0 ? counters.cacheHits / attempts : 0,
    errorRate: counters.jobs > 0 ? counters.failures / counters.jobs : 0,
  };
}

export function resetForecastTelemetryForTests(): void {
  counters.jobs = 0;
  counters.cacheHits = 0;
  counters.cacheMisses = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.byType = {};
  counters.confidenceBuckets = {
    "0-44": 0,
    "45-69": 0,
    "70-100": 0,
  };
}
