/**
 * Analytics Aggregator — pure metric contributions from events.
 * Never mutates domain data.
 */

import {
  countMetricKey,
  secondaryMetricKeys,
} from "@/lib/analytics/event-catalog";
import { toMetricDate } from "@/lib/analytics/period";
import type {
  AnalyticsDailyMetric,
  AnalyticsDimension,
  AnalyticsEventRecord,
} from "@/lib/analytics/types";

export type MetricContribution = {
  metricDate: string;
  dimension: AnalyticsDimension;
  dimensionKey: string;
  metricKey: string;
  delta: number;
};

function metricId(
  metricDate: string,
  dimension: AnalyticsDimension,
  dimensionKey: string,
  metricKey: string,
): string {
  return `${metricDate}|${dimension}|${dimensionKey}|${metricKey}`;
}

export function contributionsForEvent(
  event: Pick<
    AnalyticsEventRecord,
    | "eventType"
    | "source"
    | "organizationId"
    | "userId"
    | "entityType"
    | "entityId"
    | "occurredAt"
    | "metricValue"
    | "payload"
  >,
): MetricContribution[] {
  const metricDate = toMetricDate(event.occurredAt);
  const countKey = countMetricKey(event.eventType);
  const value = event.metricValue;
  const out: MetricContribution[] = [
    {
      metricDate,
      dimension: "global",
      dimensionKey: "_",
      metricKey: countKey,
      delta: 1,
    },
    {
      metricDate,
      dimension: "source",
      dimensionKey: event.source,
      metricKey: countKey,
      delta: 1,
    },
    {
      metricDate,
      dimension: "event_type",
      dimensionKey: event.eventType,
      metricKey: countKey,
      delta: 1,
    },
  ];

  if (event.organizationId) {
    out.push({
      metricDate,
      dimension: "organization",
      dimensionKey: event.organizationId,
      metricKey: countKey,
      delta: 1,
    });
  }
  if (event.userId) {
    out.push({
      metricDate,
      dimension: "worker",
      dimensionKey: event.userId,
      metricKey: countKey,
      delta: 1,
    });
  }
  if (event.entityType === "campaign" && event.entityId) {
    out.push({
      metricDate,
      dimension: "campaign",
      dimensionKey: event.entityId,
      metricKey: countKey,
      delta: 1,
    });
  }

  for (const sec of secondaryMetricKeys(event.eventType)) {
    out.push({
      metricDate,
      dimension: "global",
      dimensionKey: "_",
      metricKey: sec,
      delta: value,
    });
    if (event.organizationId) {
      out.push({
        metricDate,
        dimension: "organization",
        dimensionKey: event.organizationId,
        metricKey: sec,
        delta: value,
      });
    }
  }

  return out;
}

/** Fold events into daily metrics (idempotent rebuild — sum of contributions). */
export function aggregateEventsToDailyMetrics(
  events: AnalyticsEventRecord[],
  nowIso: string = new Date().toISOString(),
): AnalyticsDailyMetric[] {
  const map = new Map<string, AnalyticsDailyMetric>();

  for (const event of events) {
    if (event.status !== "processed" && event.status !== "pending") continue;
    for (const c of contributionsForEvent(event)) {
      const id = metricId(
        c.metricDate,
        c.dimension,
        c.dimensionKey,
        c.metricKey,
      );
      const existing = map.get(id);
      if (existing) {
        existing.value += c.delta;
        existing.eventCount += 1;
        existing.updatedAt = nowIso;
      } else {
        map.set(id, {
          id,
          metricDate: c.metricDate,
          dimension: c.dimension,
          dimensionKey: c.dimensionKey,
          metricKey: c.metricKey,
          value: c.delta,
          eventCount: 1,
          updatedAt: nowIso,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
}

/** Sum metrics for a period window (by metricKey, global). */
export function rollupMetrics(
  metrics: AnalyticsDailyMetric[],
  params: {
    fromDate: string;
    toDateExclusive: string;
    dimension?: AnalyticsDimension;
    dimensionKey?: string;
  },
): Record<string, number> {
  const dim = params.dimension ?? "global";
  const key = params.dimensionKey ?? "_";
  const totals: Record<string, number> = {};
  for (const m of metrics) {
    if (m.metricDate < params.fromDate) continue;
    if (m.metricDate >= params.toDateExclusive) continue;
    if (m.dimension !== dim) continue;
    if (m.dimensionKey !== key) continue;
    totals[m.metricKey] = (totals[m.metricKey] ?? 0) + m.value;
  }
  return totals;
}
