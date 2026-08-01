/**
 * Analytics query + report builders.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { generatePublicId } from "@/lib/public-id";
import {
  isAnalyticsEngineEnabled,
  isAnalyticsReportsEnabled,
  ANALYTICS_MODEL_VERSION,
} from "@/lib/analytics/config";
import { generateAnalyticsSnapshot } from "@/lib/analytics/snapshot-generator";
import { recordAnalyticsReportTelemetry } from "@/lib/analytics/telemetry";
import type {
  AggregationPeriod,
  AnalyticsDailyMetric,
  AnalyticsDimension,
  AnalyticsEventRecord,
  AnalyticsMetricQuery,
  AnalyticsQueryFilter,
  AnalyticsReportRecord,
  AnalyticsReportType,
} from "@/lib/analytics/types";
import type { Prisma } from "@/lib/generated/prisma/client";

function mapEvent(row: {
  id: string;
  publicId: string;
  source: string;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  organizationId: string | null;
  userId: string | null;
  payload: unknown;
  occurredAt: Date;
  processedAt: Date | null;
  idempotencyKey: string;
  correlationId: string | null;
  causationId: string | null;
  status: string;
  attemptCount: number;
  errorMessage: string | null;
  metricValue: number;
  modelVersion: string;
  createdAt: Date;
}): AnalyticsEventRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    source: row.source as AnalyticsEventRecord["source"],
    eventType: row.eventType as AnalyticsEventRecord["eventType"],
    entityType: row.entityType,
    entityId: row.entityId,
    organizationId: row.organizationId,
    userId: row.userId,
    payload: (row.payload as Record<string, unknown>) ?? {},
    occurredAt: row.occurredAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    idempotencyKey: row.idempotencyKey,
    correlationId: row.correlationId,
    causationId: row.causationId,
    status: row.status as AnalyticsEventRecord["status"],
    attemptCount: row.attemptCount,
    errorMessage: row.errorMessage,
    metricValue: row.metricValue,
    modelVersion: row.modelVersion,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function queryAnalyticsEvents(
  filter: AnalyticsQueryFilter = {},
): Promise<AnalyticsEventRecord[]> {
  if (!isAnalyticsEngineEnabled()) return [];
  const where: Prisma.AnalyticsEventWhereInput = {};
  if (filter.source) where.source = filter.source;
  if (filter.eventType) where.eventType = filter.eventType;
  if (filter.organizationId) where.organizationId = filter.organizationId;
  if (filter.userId) where.userId = filter.userId;
  if (filter.entityType) where.entityType = filter.entityType;
  if (filter.entityId) where.entityId = filter.entityId;
  if (filter.status) where.status = filter.status;
  if (filter.from || filter.to) {
    where.occurredAt = {};
    if (filter.from) where.occurredAt.gte = new Date(filter.from);
    if (filter.to) where.occurredAt.lt = new Date(filter.to);
  }

  const rows = await prisma.analyticsEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: filter.limit ?? 100,
  });
  return rows.map(mapEvent);
}

export async function queryAnalyticsMetrics(
  filter: AnalyticsMetricQuery = {},
): Promise<AnalyticsDailyMetric[]> {
  if (!isAnalyticsEngineEnabled()) return [];
  const where: Prisma.AnalyticsDailyMetricWhereInput = {};
  if (filter.metricKey) where.metricKey = filter.metricKey;
  if (filter.dimension) where.dimension = filter.dimension;
  if (filter.dimensionKey) where.dimensionKey = filter.dimensionKey;
  if (filter.from || filter.to) {
    where.metricDate = {};
    if (filter.from)
      where.metricDate.gte = new Date(`${filter.from}T00:00:00.000Z`);
    if (filter.to)
      where.metricDate.lt = new Date(`${filter.to}T00:00:00.000Z`);
  }

  const rows = await prisma.analyticsDailyMetric.findMany({
    where,
    orderBy: { metricDate: "desc" },
    take: filter.limit ?? 500,
  });

  return rows.map((m) => ({
    id: m.id,
    metricDate: m.metricDate.toISOString().slice(0, 10),
    dimension: m.dimension as AnalyticsDimension,
    dimensionKey: m.dimensionKey,
    metricKey: m.metricKey,
    value: m.value,
    eventCount: m.eventCount,
    updatedAt: m.updatedAt.toISOString(),
  }));
}

export async function generateAnalyticsReport(params: {
  reportType: AnalyticsReportType;
  scope?: AnalyticsDimension;
  scopeId?: string;
  period?: AggregationPeriod;
  reference?: Date;
}): Promise<AnalyticsReportRecord | null> {
  if (!isAnalyticsEngineEnabled() || !isAnalyticsReportsEnabled()) {
    return null;
  }
  try {
    const period = params.period ?? "weekly";
    const snap = await generateAnalyticsSnapshot({
      period,
      scope: params.scope,
      scopeId: params.scopeId,
      reference: params.reference,
    });
    if (!snap) return null;

    const publicId = await generatePublicId("analytics_report");
    const row = await prisma.analyticsReport.create({
      data: {
        publicId,
        reportType: params.reportType,
        title: `${params.reportType} ${period} report`,
        scope: snap.scope,
        scopeId: snap.scopeId,
        periodStart: new Date(snap.periodStart),
        periodEnd: new Date(snap.periodEnd),
        status: "ready",
        payload: {
          snapshotPublicId: snap.publicId,
          totals: (snap.payload.totals as Record<string, number>) ?? {},
          reportType: params.reportType,
        } as Prisma.InputJsonValue,
        modelVersion: ANALYTICS_MODEL_VERSION,
        generatedAt: new Date(),
      },
    });

    recordAnalyticsReportTelemetry(true);
    return {
      id: row.id,
      publicId: row.publicId,
      reportType: row.reportType as AnalyticsReportType,
      title: row.title,
      scope: row.scope as AnalyticsDimension,
      scopeId: row.scopeId,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      status: row.status as AnalyticsReportRecord["status"],
      payload: (row.payload as Record<string, unknown>) ?? {},
      modelVersion: row.modelVersion,
      generatedAt: row.generatedAt.toISOString(),
      errorMessage: row.errorMessage,
    };
  } catch (error) {
    recordAnalyticsReportTelemetry(false);
    throw error;
  }
}

export const AnalyticsQueryService = {
  queryEvents: queryAnalyticsEvents,
  queryMetrics: queryAnalyticsMetrics,
  generateReport: generateAnalyticsReport,
};
