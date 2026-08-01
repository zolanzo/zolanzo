/**
 * Public AnalyticsService facade.
 *
 * AnalyticsService.record() / query() / snapshot() / rollup()
 */

import {
  isAnalyticsEngineEnabled,
  isAnalyticsReportsEnabled,
  isAnalyticsSnapshotsEnabled,
} from "@/lib/analytics/config";
import {
  memoryGenerateReport,
  memoryGenerateSnapshot,
  memoryQueryEvents,
  memoryQueryMetrics,
  memoryRebuildDailyRollup,
  memoryRecordEvent,
} from "@/lib/analytics/memory-store";
import {
  recordAnalyticsEventTelemetry,
  recordAnalyticsReportTelemetry,
  recordAnalyticsRollupTelemetry,
  recordAnalyticsSnapshotTelemetry,
} from "@/lib/analytics/telemetry";
import type {
  AggregationPeriod,
  AnalyticsDailyMetric,
  AnalyticsDimension,
  AnalyticsEventRecord,
  AnalyticsMetricQuery,
  AnalyticsQueryFilter,
  AnalyticsReportRecord,
  AnalyticsReportType,
  AnalyticsSnapshotRecord,
  RecordAnalyticsEventInput,
} from "@/lib/analytics/types";

export type AnalyticsBackend = "memory" | "prisma";

let backend: AnalyticsBackend = "memory";

/** Prefer memory in tests; Prisma in server via setAnalyticsBackend. */
export function setAnalyticsBackend(next: AnalyticsBackend): void {
  backend = next;
}

export function getAnalyticsBackend(): AnalyticsBackend {
  return backend;
}

async function prismaRecord(
  input: RecordAnalyticsEventInput,
): Promise<AnalyticsEventRecord | null> {
  const { recordAnalyticsEvent } = await import(
    "@/lib/analytics/analytics-event-service"
  );
  return recordAnalyticsEvent(input);
}

async function prismaQuery(
  filter: AnalyticsQueryFilter,
): Promise<AnalyticsEventRecord[]> {
  const { queryAnalyticsEvents } = await import(
    "@/lib/analytics/query-service"
  );
  return queryAnalyticsEvents(filter);
}

async function prismaQueryMetrics(
  filter: AnalyticsMetricQuery,
): Promise<AnalyticsDailyMetric[]> {
  const { queryAnalyticsMetrics } = await import(
    "@/lib/analytics/query-service"
  );
  return queryAnalyticsMetrics(filter);
}

async function prismaRollup(params?: {
  period?: AggregationPeriod;
  reference?: Date;
}) {
  const { runDailyRollupJob } = await import(
    "@/lib/analytics/daily-rollup-job"
  );
  return runDailyRollupJob(params);
}

async function prismaSnapshot(params: {
  period: AggregationPeriod;
  scope?: AnalyticsDimension;
  scopeId?: string;
  reference?: Date;
}): Promise<AnalyticsSnapshotRecord | null> {
  const { generateAnalyticsSnapshot } = await import(
    "@/lib/analytics/snapshot-generator"
  );
  return generateAnalyticsSnapshot(params);
}

async function prismaReport(params: {
  reportType: AnalyticsReportType;
  scope?: AnalyticsDimension;
  scopeId?: string;
  period?: AggregationPeriod;
  reference?: Date;
}): Promise<AnalyticsReportRecord | null> {
  const { generateAnalyticsReport } = await import(
    "@/lib/analytics/query-service"
  );
  return generateAnalyticsReport(params);
}

export async function record(
  input: RecordAnalyticsEventInput,
): Promise<AnalyticsEventRecord | null> {
  if (!isAnalyticsEngineEnabled()) return null;
  if (backend === "prisma") {
    return prismaRecord(input);
  }
  const started = Date.now();
  const { event, duplicate } = memoryRecordEvent(input);
  recordAnalyticsEventTelemetry({
    success: true,
    duplicate,
    latencyMs: Date.now() - started,
    source: input.source,
  });
  return event;
}

export async function query(
  filter: AnalyticsQueryFilter = {},
): Promise<AnalyticsEventRecord[]> {
  if (!isAnalyticsEngineEnabled()) return [];
  if (backend === "prisma") return prismaQuery(filter);
  return memoryQueryEvents(filter);
}

export async function queryMetrics(
  filter: AnalyticsMetricQuery = {},
): Promise<AnalyticsDailyMetric[]> {
  if (!isAnalyticsEngineEnabled()) return [];
  if (backend === "prisma") return prismaQueryMetrics(filter);
  return memoryQueryMetrics(filter);
}

export async function rollup(params?: {
  period?: AggregationPeriod;
  reference?: Date;
  fromDate?: string;
  toDateExclusive?: string;
}): Promise<{ metricsWritten: number; durationMs: number }> {
  if (!isAnalyticsEngineEnabled()) {
    return { metricsWritten: 0, durationMs: 0 };
  }
  if (backend === "prisma") {
    return prismaRollup(params);
  }
  const result = memoryRebuildDailyRollup({
    fromDate: params?.fromDate,
    toDateExclusive: params?.toDateExclusive,
  });
  recordAnalyticsRollupTelemetry({
    success: true,
    latencyMs: result.durationMs,
  });
  return result;
}

export async function snapshot(params: {
  period: AggregationPeriod;
  scope?: AnalyticsDimension;
  scopeId?: string;
  reference?: Date;
}): Promise<AnalyticsSnapshotRecord | null> {
  if (!isAnalyticsEngineEnabled() || !isAnalyticsSnapshotsEnabled()) {
    return null;
  }
  if (backend === "prisma") return prismaSnapshot(params);
  const started = Date.now();
  const snap = memoryGenerateSnapshot(params);
  recordAnalyticsSnapshotTelemetry({
    success: true,
    latencyMs: Date.now() - started,
  });
  return snap;
}

export async function report(params: {
  reportType: AnalyticsReportType;
  scope?: AnalyticsDimension;
  scopeId?: string;
  period?: AggregationPeriod;
  reference?: Date;
}): Promise<AnalyticsReportRecord | null> {
  if (!isAnalyticsEngineEnabled() || !isAnalyticsReportsEnabled()) {
    return null;
  }
  if (backend === "prisma") return prismaReport(params);
  const result = memoryGenerateReport(params);
  recordAnalyticsReportTelemetry(true);
  return result;
}

export const AnalyticsService = {
  record,
  query,
  queryMetrics,
  snapshot,
  rollup,
  report,
  setBackend: setAnalyticsBackend,
  getBackend: getAnalyticsBackend,
};

export const AnalyticsEventService = {
  record,
};
