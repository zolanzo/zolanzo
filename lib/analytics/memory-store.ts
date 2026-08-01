/**
 * In-memory analytics store — unit tests + local replay without Prisma.
 */

import { defaultMetricValue } from "@/lib/analytics/event-catalog";
import {
  aggregateEventsToDailyMetrics,
  contributionsForEvent,
} from "@/lib/analytics/aggregator";
import { datesInRange, periodWindowFor, toMetricDate } from "@/lib/analytics/period";
import type {
  AggregationPeriod,
  AnalyticsDailyMetric,
  AnalyticsDimension,
  AnalyticsEventRecord,
  AnalyticsEventType,
  AnalyticsMetricQuery,
  AnalyticsQueryFilter,
  AnalyticsReportRecord,
  AnalyticsReportType,
  AnalyticsSnapshotRecord,
  RecordAnalyticsEventInput,
} from "@/lib/analytics/types";
import { ANALYTICS_MODEL_VERSION } from "@/lib/analytics/types";

let seq = 0;
const events = new Map<string, AnalyticsEventRecord>();
const byIdempotency = new Map<string, string>();
const metrics = new Map<string, AnalyticsDailyMetric>();
const snapshots: AnalyticsSnapshotRecord[] = [];
const reports: AnalyticsReportRecord[] = [];

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

function nextPublicId(prefix: string): string {
  seq += 1;
  const body = seq.toString(36).toUpperCase().padStart(6, "2").slice(-6);
  return `${prefix}-${body}`;
}

export function resetAnalyticsMemoryStoreForTests(): void {
  seq = 0;
  events.clear();
  byIdempotency.clear();
  metrics.clear();
  snapshots.length = 0;
  reports.length = 0;
}

export function memoryRecordEvent(
  input: RecordAnalyticsEventInput,
): { event: AnalyticsEventRecord; duplicate: boolean } {
  const existingId = byIdempotency.get(input.idempotencyKey);
  if (existingId) {
    const existing = events.get(existingId);
    if (existing) return { event: existing, duplicate: true };
  }

  const occurredAt =
    input.occurredAt == null
      ? new Date().toISOString()
      : typeof input.occurredAt === "string"
        ? new Date(input.occurredAt).toISOString()
        : input.occurredAt.toISOString();

  const metricValue = defaultMetricValue(
    input.eventType,
    input.payload,
    input.metricValue,
  );

  const now = new Date().toISOString();
  const event: AnalyticsEventRecord = {
    id: nextId("ane"),
    publicId: nextPublicId("ANE"),
    source: input.source,
    eventType: input.eventType,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    organizationId: input.organizationId ?? null,
    userId: input.userId ?? null,
    payload: input.payload ?? {},
    occurredAt,
    processedAt: now,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId ?? null,
    causationId: input.causationId ?? null,
    status: "processed",
    attemptCount: 1,
    errorMessage: null,
    metricValue,
    modelVersion: ANALYTICS_MODEL_VERSION,
    createdAt: now,
  };

  events.set(event.id, event);
  byIdempotency.set(event.idempotencyKey, event.id);

  for (const c of contributionsForEvent(event)) {
    const id = `${c.metricDate}|${c.dimension}|${c.dimensionKey}|${c.metricKey}`;
    const existing = metrics.get(id);
    if (existing) {
      existing.value += c.delta;
      existing.eventCount += 1;
      existing.updatedAt = now;
    } else {
      metrics.set(id, {
        id,
        metricDate: c.metricDate,
        dimension: c.dimension,
        dimensionKey: c.dimensionKey,
        metricKey: c.metricKey,
        value: c.delta,
        eventCount: 1,
        updatedAt: now,
      });
    }
  }

  return { event, duplicate: false };
}

export function memoryQueryEvents(
  filter: AnalyticsQueryFilter = {},
): AnalyticsEventRecord[] {
  let rows = [...events.values()];
  if (filter.source) rows = rows.filter((e) => e.source === filter.source);
  if (filter.eventType)
    rows = rows.filter((e) => e.eventType === filter.eventType);
  if (filter.organizationId)
    rows = rows.filter((e) => e.organizationId === filter.organizationId);
  if (filter.userId) rows = rows.filter((e) => e.userId === filter.userId);
  if (filter.entityType)
    rows = rows.filter((e) => e.entityType === filter.entityType);
  if (filter.entityId)
    rows = rows.filter((e) => e.entityId === filter.entityId);
  if (filter.status) rows = rows.filter((e) => e.status === filter.status);
  if (filter.from) rows = rows.filter((e) => e.occurredAt >= filter.from!);
  if (filter.to) rows = rows.filter((e) => e.occurredAt < filter.to!);
  rows.sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1));
  const limit = filter.limit ?? 100;
  return rows.slice(0, limit);
}

export function memoryQueryMetrics(
  filter: AnalyticsMetricQuery = {},
): AnalyticsDailyMetric[] {
  let rows = [...metrics.values()];
  if (filter.metricKey)
    rows = rows.filter((m) => m.metricKey === filter.metricKey);
  if (filter.dimension)
    rows = rows.filter((m) => m.dimension === filter.dimension);
  if (filter.dimensionKey)
    rows = rows.filter((m) => m.dimensionKey === filter.dimensionKey);
  if (filter.from) rows = rows.filter((m) => m.metricDate >= filter.from!);
  if (filter.to) rows = rows.filter((m) => m.metricDate < filter.to!);
  rows.sort((a, b) => (a.metricDate < b.metricDate ? 1 : -1));
  return rows.slice(0, filter.limit ?? 500);
}

export function memoryRebuildDailyRollup(params?: {
  fromDate?: string;
  toDateExclusive?: string;
}): { metricsWritten: number; durationMs: number } {
  const started = Date.now();
  const all = [...events.values()].filter(
    (e) => e.status === "processed" || e.status === "pending",
  );
  const rebuilt = aggregateEventsToDailyMetrics(all);
  metrics.clear();
  let written = 0;
  for (const m of rebuilt) {
    if (params?.fromDate && m.metricDate < params.fromDate) continue;
    if (params?.toDateExclusive && m.metricDate >= params.toDateExclusive)
      continue;
    metrics.set(m.id, m);
    written += 1;
  }
  return { metricsWritten: written, durationMs: Date.now() - started };
}

export function memoryGenerateSnapshot(params: {
  period: AggregationPeriod;
  scope?: AnalyticsDimension;
  scopeId?: string;
  reference?: Date;
}): AnalyticsSnapshotRecord {
  const window = periodWindowFor(params.period, params.reference ?? new Date());
  const scope = params.scope ?? "global";
  const scopeId = params.scopeId ?? "_";
  const fromDate = toMetricDate(window.periodStart);
  const toDateExclusive = toMetricDate(window.periodEnd);
  const started = Date.now();

  const dayMetrics = memoryQueryMetrics({
    dimension: scope,
    dimensionKey: scopeId,
    from: fromDate,
    to: toDateExclusive,
    limit: 5000,
  });

  const totals: Record<string, number> = {};
  for (const m of dayMetrics) {
    totals[m.metricKey] = (totals[m.metricKey] ?? 0) + m.value;
  }

  const eventTypes: Partial<Record<AnalyticsEventType, number>> = {};
  for (const e of memoryQueryEvents({
    from: window.periodStart,
    to: window.periodEnd,
    limit: 10_000,
  })) {
    eventTypes[e.eventType] = (eventTypes[e.eventType] ?? 0) + 1;
  }

  const snap: AnalyticsSnapshotRecord = {
    id: nextId("ans"),
    publicId: nextPublicId("ANS"),
    period: params.period,
    periodStart: window.periodStart,
    periodEnd: window.periodEnd,
    scope,
    scopeId,
    payload: {
      totals,
      eventTypes,
      days: datesInRange(window.periodStart, window.periodEnd),
      metricRows: dayMetrics.length,
    },
    durationMs: Date.now() - started,
    modelVersion: ANALYTICS_MODEL_VERSION,
    generatedAt: new Date().toISOString(),
  };
  snapshots.push(snap);
  return snap;
}

export function memoryGenerateReport(params: {
  reportType: AnalyticsReportType;
  scope?: AnalyticsDimension;
  scopeId?: string;
  period?: AggregationPeriod;
  reference?: Date;
}): AnalyticsReportRecord {
  const period = params.period ?? "weekly";
  const snap = memoryGenerateSnapshot({
    period,
    scope: params.scope,
    scopeId: params.scopeId,
    reference: params.reference,
  });
  const report: AnalyticsReportRecord = {
    id: nextId("anr"),
    publicId: nextPublicId("ANR"),
    reportType: params.reportType,
    title: `${params.reportType} ${period} report`,
    scope: snap.scope,
    scopeId: snap.scopeId,
    periodStart: snap.periodStart,
    periodEnd: snap.periodEnd,
    status: "ready",
    payload: {
      snapshotPublicId: snap.publicId,
      totals: (snap.payload.totals as Record<string, number>) ?? {},
      reportType: params.reportType,
    },
    modelVersion: ANALYTICS_MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    errorMessage: null,
  };
  reports.push(report);
  return report;
}

export function memoryListSnapshots(): AnalyticsSnapshotRecord[] {
  return [...snapshots];
}

export function memoryListReports(): AnalyticsReportRecord[] {
  return [...reports];
}

export function memoryAllEvents(): AnalyticsEventRecord[] {
  return [...events.values()];
}
