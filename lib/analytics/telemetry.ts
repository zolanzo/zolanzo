/**
 * Analytics telemetry — Admin Analytics Health.
 */

import type { AnalyticsHealthCounters } from "@/lib/analytics/types";

const counters: AnalyticsHealthCounters = {
  eventsRecorded: 0,
  eventsDuplicate: 0,
  eventsFailed: 0,
  eventsDeadLetter: 0,
  rollupsRun: 0,
  snapshotsGenerated: 0,
  reportsGenerated: 0,
  failures: 0,
  totalRecordLatencyMs: 0,
  totalRollupLatencyMs: 0,
  totalSnapshotLatencyMs: 0,
  lastLatencyMs: null,
  lastAt: null,
  eventsBySource: {},
  visibilityUsage: {},
};

export function recordAnalyticsEventTelemetry(event: {
  success: boolean;
  duplicate?: boolean;
  latencyMs: number;
  source?: string;
  deadLetter?: boolean;
}): void {
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  counters.totalRecordLatencyMs += event.latencyMs;
  if (event.deadLetter) {
    counters.eventsDeadLetter += 1;
    counters.failures += 1;
    return;
  }
  if (!event.success) {
    counters.eventsFailed += 1;
    counters.failures += 1;
    return;
  }
  if (event.duplicate) {
    counters.eventsDuplicate += 1;
    return;
  }
  counters.eventsRecorded += 1;
  if (event.source) {
    counters.eventsBySource[event.source] =
      (counters.eventsBySource[event.source] ?? 0) + 1;
  }
}

export function recordAnalyticsRollupTelemetry(event: {
  success: boolean;
  latencyMs: number;
}): void {
  counters.rollupsRun += 1;
  counters.totalRollupLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (!event.success) counters.failures += 1;
}

export function recordAnalyticsSnapshotTelemetry(event: {
  success: boolean;
  latencyMs: number;
}): void {
  counters.snapshotsGenerated += 1;
  counters.totalSnapshotLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (!event.success) counters.failures += 1;
}

export function recordAnalyticsReportTelemetry(success: boolean): void {
  counters.reportsGenerated += 1;
  if (!success) counters.failures += 1;
}

export function getAnalyticsTelemetrySnapshot(): AnalyticsHealthCounters & {
  averageRecordLatencyMs: number;
  averageRollupLatencyMs: number;
  averageSnapshotLatencyMs: number;
  eventsPerSecEstimate: number;
  errorRate: number;
} {
  const recordAttempts =
    counters.eventsRecorded +
    counters.eventsDuplicate +
    counters.eventsFailed;
  const averageRecordLatencyMs =
    recordAttempts > 0
      ? Math.round(counters.totalRecordLatencyMs / recordAttempts)
      : 0;
  return {
    ...counters,
    eventsBySource: { ...counters.eventsBySource },
    visibilityUsage: { ...counters.visibilityUsage },
    averageRecordLatencyMs,
    averageRollupLatencyMs:
      counters.rollupsRun > 0
        ? Math.round(counters.totalRollupLatencyMs / counters.rollupsRun)
        : 0,
    averageSnapshotLatencyMs:
      counters.snapshotsGenerated > 0
        ? Math.round(
            counters.totalSnapshotLatencyMs / counters.snapshotsGenerated,
          )
        : 0,
    eventsPerSecEstimate:
      averageRecordLatencyMs > 0
        ? Math.round(1000 / Math.max(averageRecordLatencyMs, 1))
        : counters.eventsRecorded,
    errorRate:
      recordAttempts > 0 ? counters.eventsFailed / recordAttempts : 0,
  };
}

export function resetAnalyticsTelemetryForTests(): void {
  counters.eventsRecorded = 0;
  counters.eventsDuplicate = 0;
  counters.eventsFailed = 0;
  counters.eventsDeadLetter = 0;
  counters.rollupsRun = 0;
  counters.snapshotsGenerated = 0;
  counters.reportsGenerated = 0;
  counters.failures = 0;
  counters.totalRecordLatencyMs = 0;
  counters.totalRollupLatencyMs = 0;
  counters.totalSnapshotLatencyMs = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.eventsBySource = {};
  counters.visibilityUsage = {};
}
