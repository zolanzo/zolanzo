/**
 * Period window helpers for rollups & snapshots.
 */

import type { AggregationPeriod } from "@/lib/analytics/types";

export function toMetricDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export type PeriodWindow = {
  period: AggregationPeriod;
  periodStart: string;
  periodEnd: string;
};

/** Inclusive start, exclusive end (ISO). */
export function periodWindowFor(
  period: AggregationPeriod,
  reference: Date = new Date(),
): PeriodWindow {
  const day = startOfUtcDay(reference);
  if (period === "daily") {
    const end = addUtcDays(day, 1);
    return {
      period,
      periodStart: day.toISOString(),
      periodEnd: end.toISOString(),
    };
  }
  if (period === "weekly") {
    const dow = day.getUTCDay(); // 0 Sun
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const start = addUtcDays(day, mondayOffset);
    const end = addUtcDays(start, 7);
    return {
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    };
  }
  if (period === "monthly") {
    const start = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 1),
    );
    return {
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    };
  }
  if (period === "quarterly") {
    const q = Math.floor(day.getUTCMonth() / 3);
    const start = new Date(Date.UTC(day.getUTCFullYear(), q * 3, 1));
    const end = new Date(Date.UTC(day.getUTCFullYear(), q * 3 + 3, 1));
    return {
      period,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    };
  }
  const start = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const end = new Date(Date.UTC(day.getUTCFullYear() + 1, 0, 1));
  return {
    period: "yearly",
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
  };
}

export function datesInRange(fromIso: string, toIsoExclusive: string): string[] {
  const out: string[] = [];
  let cur = startOfUtcDay(new Date(fromIso));
  const end = new Date(toIsoExclusive);
  while (cur < end) {
    out.push(toMetricDate(cur));
    cur = addUtcDays(cur, 1);
  }
  return out;
}
