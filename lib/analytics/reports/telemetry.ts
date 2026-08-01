/**
 * Reports telemetry — Admin Reports Health.
 */

import type { ReportsHealthCounters } from "@/lib/analytics/reports/types";

const counters: ReportsHealthCounters = {
  reportsGenerated: 0,
  exportsGenerated: 0,
  scheduleExecutions: 0,
  failures: 0,
  totalExportDurationMs: 0,
  totalBuildDurationMs: 0,
  lastExportDurationMs: null,
  lastAt: null,
  byType: {},
  byFormat: {},
  storageBytes: 0,
  queueDepth: 0,
};

export function recordReportBuild(event: {
  type: string;
  success: boolean;
  durationMs: number;
}): void {
  counters.lastAt = new Date().toISOString();
  counters.totalBuildDurationMs += event.durationMs;
  if (!event.success) {
    counters.failures += 1;
    return;
  }
  counters.reportsGenerated += 1;
  counters.byType[event.type] = (counters.byType[event.type] ?? 0) + 1;
}

export function recordReportExport(event: {
  format: string;
  success: boolean;
  durationMs: number;
  byteLength: number;
}): void {
  counters.lastAt = new Date().toISOString();
  counters.lastExportDurationMs = event.durationMs;
  counters.totalExportDurationMs += event.durationMs;
  if (!event.success) {
    counters.failures += 1;
    return;
  }
  counters.exportsGenerated += 1;
  counters.byFormat[event.format] = (counters.byFormat[event.format] ?? 0) + 1;
  counters.storageBytes += event.byteLength;
}

export function recordScheduleExecution(success: boolean): void {
  counters.scheduleExecutions += 1;
  counters.lastAt = new Date().toISOString();
  if (!success) counters.failures += 1;
}

export function setReportQueueDepth(n: number): void {
  counters.queueDepth = Math.max(0, n);
}

export function getReportsTelemetrySnapshot(): ReportsHealthCounters & {
  averageExportDurationMs: number;
  averageBuildDurationMs: number;
  errorRate: number;
} {
  return {
    ...counters,
    byType: { ...counters.byType },
    byFormat: { ...counters.byFormat },
    averageExportDurationMs:
      counters.exportsGenerated > 0
        ? Math.round(
            counters.totalExportDurationMs / counters.exportsGenerated,
          )
        : 0,
    averageBuildDurationMs:
      counters.reportsGenerated > 0
        ? Math.round(counters.totalBuildDurationMs / counters.reportsGenerated)
        : 0,
    errorRate:
      counters.reportsGenerated + counters.exportsGenerated > 0
        ? counters.failures /
          (counters.reportsGenerated +
            counters.exportsGenerated +
            counters.failures)
        : 0,
  };
}

export function resetReportsTelemetryForTests(): void {
  counters.reportsGenerated = 0;
  counters.exportsGenerated = 0;
  counters.scheduleExecutions = 0;
  counters.failures = 0;
  counters.totalExportDurationMs = 0;
  counters.totalBuildDurationMs = 0;
  counters.lastExportDurationMs = null;
  counters.lastAt = null;
  counters.byType = {};
  counters.byFormat = {};
  counters.storageBytes = 0;
  counters.queueDepth = 0;
}
