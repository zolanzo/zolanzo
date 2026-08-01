/**
 * Read helpers for widgets — AnalyticsService only (no domain tables, no writes).
 */

import { AnalyticsService } from "@/lib/analytics/analytics-service";
import { periodWindowFor, toMetricDate } from "@/lib/analytics/period";
import type { AggregationPeriod } from "@/lib/analytics/types";

export type MetricBag = Record<string, number>;

export async function loadPeriodTotals(params: {
  period?: AggregationPeriod;
  reference?: Date;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId?: string | null;
}): Promise<{
  totals: MetricBag;
  eventTypes: Record<string, number>;
  snapshotGeneratedAt: string | null;
  queryDurationMs: number;
}> {
  const started = Date.now();
  const period = params.period ?? "daily";
  const window = periodWindowFor(period, params.reference ?? new Date());
  const fromDate = toMetricDate(window.periodStart);
  const toDate = toMetricDate(window.periodEnd);

  const dimension = params.campaignId
    ? "campaign"
    : params.organizationId
      ? "organization"
      : params.workerUserId
        ? "worker"
        : "global";
  const dimensionKey =
    params.campaignId ??
    params.organizationId ??
    params.workerUserId ??
    "_";

  const [metrics, events] = await Promise.all([
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
      organizationId: params.organizationId ?? undefined,
      userId: params.workerUserId ?? undefined,
      limit: 2000,
    }),
  ]);

  const totals: MetricBag = {};
  let latestMetricAt: string | null = null;
  for (const m of metrics) {
    totals[m.metricKey] = (totals[m.metricKey] ?? 0) + m.value;
    if (!latestMetricAt || m.updatedAt > latestMetricAt) {
      latestMetricAt = m.updatedAt;
    }
  }

  const eventTypes: Record<string, number> = {};
  for (const e of events) {
    if (params.campaignId && e.entityId !== params.campaignId) continue;
    eventTypes[e.eventType] = (eventTypes[e.eventType] ?? 0) + 1;
  }

  return {
    totals,
    eventTypes,
    snapshotGeneratedAt: latestMetricAt,
    queryDurationMs: Date.now() - started,
  };
}

export function metric(
  totals: MetricBag,
  key: string,
  fallback = 0,
): number {
  const v = totals[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}
