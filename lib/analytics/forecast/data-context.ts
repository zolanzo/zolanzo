/**
 * Forecast input context — reads Analytics / Trust / AI only (no domain writes).
 */

import { AnalyticsService } from "@/lib/analytics/analytics-service";
import { periodWindowFor, toMetricDate } from "@/lib/analytics/period";
import type { ForecastRequest } from "@/lib/analytics/forecast/types";

export type ForecastMetricBag = Record<string, number>;

export type ForecastDataContext = {
  totals: ForecastMetricBag;
  eventTypes: Record<string, number>;
  sampleSize: number;
  periodStart: string;
  periodEnd: string;
  trust: {
    averageScore: number;
    rising: number;
    falling: number;
    profiles: number;
    eventsFailed: number;
  } | null;
  ai: {
    requests: number;
    failures: number;
    avgLatencyMs: number;
    totalTokens: number;
    totalCostMicroUsd: number;
    byProvider: Record<string, { requests: number; failures: number }>;
  } | null;
  queryDurationMs: number;
};

function metricSum(totals: ForecastMetricBag, key: string): number {
  const v = totals[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export { metricSum };

export async function loadForecastDataContext(
  request: ForecastRequest,
): Promise<ForecastDataContext> {
  const started = Date.now();
  const window = periodWindowFor("weekly", request.reference ?? new Date());
  const fromDate = toMetricDate(window.periodStart);
  const toDate = toMetricDate(window.periodEnd);

  const dimension = request.campaignId
    ? "campaign"
    : request.organizationId
      ? "organization"
      : request.workerUserId
        ? "worker"
        : "global";
  const dimensionKey =
    request.campaignId ??
    request.organizationId ??
    request.workerUserId ??
    "_";

  const [metrics, events, trust, ai] = await Promise.all([
    AnalyticsService.queryMetrics({
      dimension,
      dimensionKey,
      from: fromDate,
      to: toDate,
      limit: 2000,
    }),
    AnalyticsService.query({
      from: window.periodStart,
      to: window.periodEnd,
      organizationId: request.organizationId ?? undefined,
      userId: request.workerUserId ?? undefined,
      limit: 2000,
    }),
    loadTrustSignals(),
    loadAiSignals(),
  ]);

  const totals: ForecastMetricBag = {};
  for (const m of metrics) {
    totals[m.metricKey] = (totals[m.metricKey] ?? 0) + m.value;
  }

  const eventTypes: Record<string, number> = {};
  for (const e of events) {
    if (request.campaignId && e.entityId !== request.campaignId) continue;
    eventTypes[e.eventType] = (eventTypes[e.eventType] ?? 0) + 1;
  }

  return {
    totals,
    eventTypes,
    sampleSize: events.length,
    periodStart: window.periodStart,
    periodEnd: window.periodEnd,
    trust,
    ai,
    queryDurationMs: Date.now() - started,
  };
}

async function loadTrustSignals(): Promise<ForecastDataContext["trust"]> {
  try {
    const { getTrustTelemetrySnapshot } = await import("@/lib/trust/telemetry");
    const t = getTrustTelemetrySnapshot();
    return {
      averageScore: t.averageScore,
      rising: t.risingCount,
      falling: t.fallingCount,
      profiles: t.scoredProfiles,
      eventsFailed: t.eventsFailed,
    };
  } catch {
    return null;
  }
}

async function loadAiSignals(): Promise<ForecastDataContext["ai"]> {
  try {
    const { getAiTelemetrySnapshot } = await import("@/lib/ai/telemetry");
    const snap = getAiTelemetrySnapshot();
    const byProvider: Record<string, { requests: number; failures: number }> =
      {};
    for (const [k, v] of Object.entries(snap.byProvider)) {
      byProvider[k] = { requests: v.requests, failures: v.failures };
    }
    return {
      requests: snap.totals.requests,
      failures: snap.totals.failures,
      avgLatencyMs: snap.totals.avgLatencyMs,
      totalTokens: snap.totals.totalTokens,
      totalCostMicroUsd: snap.totals.totalCostMicroUsd,
      byProvider,
    };
  } catch {
    return null;
  }
}
