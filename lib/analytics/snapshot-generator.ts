/**
 * Snapshot generator — period rollups into analytics_snapshots.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { generatePublicId } from "@/lib/public-id";
import {
  isAnalyticsEngineEnabled,
  isAnalyticsSnapshotsEnabled,
  ANALYTICS_MODEL_VERSION,
} from "@/lib/analytics/config";
import { datesInRange, periodWindowFor, toMetricDate } from "@/lib/analytics/period";
import { recordAnalyticsSnapshotTelemetry } from "@/lib/analytics/telemetry";
import type {
  AggregationPeriod,
  AnalyticsDimension,
  AnalyticsSnapshotRecord,
} from "@/lib/analytics/types";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function generateAnalyticsSnapshot(params: {
  period: AggregationPeriod;
  scope?: AnalyticsDimension;
  scopeId?: string;
  reference?: Date;
}): Promise<AnalyticsSnapshotRecord | null> {
  if (!isAnalyticsEngineEnabled() || !isAnalyticsSnapshotsEnabled()) {
    return null;
  }
  const started = Date.now();
  const window = periodWindowFor(params.period, params.reference ?? new Date());
  const scope = params.scope ?? "global";
  const scopeId = params.scopeId ?? "_";
  const fromDate = toMetricDate(window.periodStart);
  const toDateExclusive = toMetricDate(window.periodEnd);

  try {
    const dayMetrics = await prisma.analyticsDailyMetric.findMany({
      where: {
        dimension: scope,
        dimensionKey: scopeId,
        metricDate: {
          gte: new Date(`${fromDate}T00:00:00.000Z`),
          lt: new Date(`${toDateExclusive}T00:00:00.000Z`),
        },
      },
      take: 10_000,
    });

    const totals: Record<string, number> = {};
    for (const m of dayMetrics) {
      totals[m.metricKey] = (totals[m.metricKey] ?? 0) + m.value;
    }

    const eventTypeCounts = await prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: {
        occurredAt: {
          gte: new Date(window.periodStart),
          lt: new Date(window.periodEnd),
        },
        status: "processed",
      },
      _count: { _all: true },
    });

    const eventTypes: Record<string, number> = {};
    for (const row of eventTypeCounts) {
      eventTypes[row.eventType] = row._count._all;
    }

    const durationMs = Date.now() - started;
    const publicId = await generatePublicId("analytics_snapshot");
    const row = await prisma.analyticsSnapshot.create({
      data: {
        publicId,
        period: params.period,
        periodStart: new Date(window.periodStart),
        periodEnd: new Date(window.periodEnd),
        scope,
        scopeId,
        payload: {
          totals,
          eventTypes,
          days: datesInRange(window.periodStart, window.periodEnd),
          metricRows: dayMetrics.length,
        } as Prisma.InputJsonValue,
        durationMs,
        modelVersion: ANALYTICS_MODEL_VERSION,
        generatedAt: new Date(),
      },
    });

    recordAnalyticsSnapshotTelemetry({ success: true, latencyMs: durationMs });

    return {
      id: row.id,
      publicId: row.publicId,
      period: row.period as AggregationPeriod,
      periodStart: row.periodStart.toISOString(),
      periodEnd: row.periodEnd.toISOString(),
      scope: row.scope as AnalyticsDimension,
      scopeId: row.scopeId,
      payload: (row.payload as Record<string, unknown>) ?? {},
      durationMs: row.durationMs,
      modelVersion: row.modelVersion,
      generatedAt: row.generatedAt.toISOString(),
    };
  } catch (error) {
    recordAnalyticsSnapshotTelemetry({
      success: false,
      latencyMs: Date.now() - started,
    });
    throw error;
  }
}

export const SnapshotGenerator = {
  generateAnalyticsSnapshot,
};
