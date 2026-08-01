/**
 * Daily / period rollup job — rebuilds analytics_daily_metrics from events.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { isAnalyticsEngineEnabled } from "@/lib/analytics/config";
import {
  aggregateEventsToDailyMetrics,
} from "@/lib/analytics/aggregator";
import { periodWindowFor, toMetricDate } from "@/lib/analytics/period";
import { recordAnalyticsRollupTelemetry } from "@/lib/analytics/telemetry";
import type {
  AggregationPeriod,
  AnalyticsEventRecord,
} from "@/lib/analytics/types";

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

export async function runDailyRollupJob(params?: {
  period?: AggregationPeriod;
  reference?: Date;
}): Promise<{ metricsWritten: number; durationMs: number }> {
  if (!isAnalyticsEngineEnabled()) {
    return { metricsWritten: 0, durationMs: 0 };
  }
  const started = Date.now();
  const period = params?.period ?? "daily";
  const window = periodWindowFor(period, params?.reference ?? new Date());
  const fromDate = toMetricDate(window.periodStart);
  const toDateExclusive = toMetricDate(window.periodEnd);

  try {
    const rows = await prisma.analyticsEvent.findMany({
      where: {
        occurredAt: {
          gte: new Date(window.periodStart),
          lt: new Date(window.periodEnd),
        },
        status: { in: ["processed", "pending"] },
      },
      take: 50_000,
      orderBy: { occurredAt: "asc" },
    });

    const rebuilt = aggregateEventsToDailyMetrics(rows.map(mapEvent));
    const filtered = rebuilt.filter(
      (m) => m.metricDate >= fromDate && m.metricDate < toDateExclusive,
    );

    // Clear window metrics then rewrite (idempotent rebuild)
    await prisma.analyticsDailyMetric.deleteMany({
      where: {
        metricDate: {
          gte: new Date(`${fromDate}T00:00:00.000Z`),
          lt: new Date(`${toDateExclusive}T00:00:00.000Z`),
        },
      },
    });

    let written = 0;
    if (filtered.length > 0) {
      // Batched insert — same rows as sequential creates; no business-logic change.
      const result = await prisma.analyticsDailyMetric.createMany({
        data: filtered.map((m) => ({
          metricDate: new Date(`${m.metricDate}T00:00:00.000Z`),
          dimension: m.dimension,
          dimensionKey: m.dimensionKey,
          metricKey: m.metricKey,
          value: m.value,
          eventCount: m.eventCount,
        })),
      });
      written = result.count;
    }

    const durationMs = Date.now() - started;
    recordAnalyticsRollupTelemetry({ success: true, latencyMs: durationMs });
    return { metricsWritten: written, durationMs };
  } catch (error) {
    const durationMs = Date.now() - started;
    recordAnalyticsRollupTelemetry({ success: false, latencyMs: durationMs });
    throw error;
  }
}

export const AnalyticsAggregator = {
  runDailyRollupJob,
};
