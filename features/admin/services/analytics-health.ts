/**
 * Admin Analytics Health — BI pipeline observability (4.3A).
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  isAnalyticsEngineEnabled,
  isAnalyticsReportsEnabled,
  isAnalyticsSnapshotsEnabled,
  ANALYTICS_MODEL_VERSION,
} from "@/lib/analytics/config";
import { getAnalyticsTelemetrySnapshot } from "@/lib/analytics/telemetry";

export type AnalyticsHealthSnapshot = {
  analyticsEngineEnabled: boolean;
  snapshotsEnabled: boolean;
  reportsEnabled: boolean;
  modelVersion: string;
  eventsTotal: number;
  eventsPerHour: number;
  eventsPerSecEstimate: number;
  rollupsRun: number;
  snapshotsGenerated: number;
  reportsGenerated: number;
  averageRecordLatencyMs: number;
  averageRollupLatencyMs: number;
  averageSnapshotLatencyMs: number;
  failedEvents: number;
  deadLetter: number;
  eventsBySource: Record<string, number>;
  failures: number;
  errorRate: number;
  generatedAt: string;
};

export async function getAnalyticsHealthSnapshot(): Promise<AnalyticsHealthSnapshot> {
  const telemetry = getAnalyticsTelemetrySnapshot();
  const hourAgo = new Date(Date.now() - 3_600_000);

  const [eventsTotal, eventsHour, failed, dlq, snapshots, reports, bySource] =
    await Promise.all([
      prisma.analyticsEvent.count().catch(() => 0),
      prisma.analyticsEvent
        .count({
          where: { createdAt: { gte: hourAgo }, status: "processed" },
        })
        .catch(() => 0),
      prisma.analyticsEvent
        .count({ where: { status: "failed" } })
        .catch(() => 0),
      prisma.analyticsEvent
        .count({ where: { status: "dead_letter" } })
        .catch(() => 0),
      prisma.analyticsSnapshot.count().catch(() => 0),
      prisma.analyticsReport.count().catch(() => 0),
      prisma.analyticsEvent
        .groupBy({
          by: ["source"],
          _count: { _all: true },
          orderBy: { _count: { source: "desc" } },
          take: 50,
        })
        .catch(
          () =>
            [] as Array<{ source: string; _count: { _all: number } }>,
        ),
    ]);

  const eventsBySource: Record<string, number> = {
    ...telemetry.eventsBySource,
  };
  for (const row of bySource as Array<{
    source: string;
    _count: { _all: number };
  }>) {
    eventsBySource[row.source] = row._count._all;
  }

  return {
    analyticsEngineEnabled: isAnalyticsEngineEnabled(),
    snapshotsEnabled: isAnalyticsSnapshotsEnabled(),
    reportsEnabled: isAnalyticsReportsEnabled(),
    modelVersion: ANALYTICS_MODEL_VERSION,
    eventsTotal: eventsTotal || telemetry.eventsRecorded,
    eventsPerHour: eventsHour || telemetry.eventsRecorded,
    eventsPerSecEstimate: telemetry.eventsPerSecEstimate,
    rollupsRun: telemetry.rollupsRun,
    snapshotsGenerated: snapshots || telemetry.snapshotsGenerated,
    reportsGenerated: reports || telemetry.reportsGenerated,
    averageRecordLatencyMs: telemetry.averageRecordLatencyMs,
    averageRollupLatencyMs: telemetry.averageRollupLatencyMs,
    averageSnapshotLatencyMs: telemetry.averageSnapshotLatencyMs,
    failedEvents: failed || telemetry.eventsFailed,
    deadLetter: dlq || telemetry.eventsDeadLetter,
    eventsBySource,
    failures: telemetry.failures,
    errorRate: telemetry.errorRate,
    generatedAt: new Date().toISOString(),
  };
}
