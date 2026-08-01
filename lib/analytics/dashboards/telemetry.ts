/**
 * Dashboard telemetry — Admin Dashboard Health.
 */

import type { DashboardHealthCounters } from "@/lib/analytics/dashboards/types";

const counters: DashboardHealthCounters = {
  builds: 0,
  cacheHits: 0,
  cacheMisses: 0,
  widgetFailures: 0,
  totalRenderLatencyMs: 0,
  totalQueryDurationMs: 0,
  lastRenderLatencyMs: null,
  lastAt: null,
  byDashboard: {},
};

export function recordDashboardBuild(event: {
  type: string;
  cacheHit: boolean;
  renderLatencyMs: number;
  queryDurationMs: number;
  widgetFailures: number;
}): void {
  counters.builds += 1;
  if (event.cacheHit) counters.cacheHits += 1;
  else counters.cacheMisses += 1;
  counters.widgetFailures += event.widgetFailures;
  counters.totalRenderLatencyMs += event.renderLatencyMs;
  counters.totalQueryDurationMs += event.queryDurationMs;
  counters.lastRenderLatencyMs = event.renderLatencyMs;
  counters.lastAt = new Date().toISOString();
  counters.byDashboard[event.type] =
    (counters.byDashboard[event.type] ?? 0) + 1;
}

export function getDashboardTelemetrySnapshot(): DashboardHealthCounters & {
  averageRenderLatencyMs: number;
  averageQueryDurationMs: number;
  cacheHitRate: number;
} {
  const attempts = counters.cacheHits + counters.cacheMisses;
  return {
    ...counters,
    byDashboard: { ...counters.byDashboard },
    averageRenderLatencyMs:
      counters.builds > 0
        ? Math.round(counters.totalRenderLatencyMs / counters.builds)
        : 0,
    averageQueryDurationMs:
      counters.builds > 0
        ? Math.round(counters.totalQueryDurationMs / counters.builds)
        : 0,
    cacheHitRate: attempts > 0 ? counters.cacheHits / attempts : 0,
  };
}

export function resetDashboardTelemetryForTests(): void {
  counters.builds = 0;
  counters.cacheHits = 0;
  counters.cacheMisses = 0;
  counters.widgetFailures = 0;
  counters.totalRenderLatencyMs = 0;
  counters.totalQueryDurationMs = 0;
  counters.lastRenderLatencyMs = null;
  counters.lastAt = null;
  counters.byDashboard = {};
}
