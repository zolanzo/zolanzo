/**
 * Phase 4.3A — Analytics Foundation tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AnalyticsService,
  ANALYTICS_MODEL_VERSION,
  aggregateEventsToDailyMetrics,
  contributionsForEvent,
  isAnalyticsEngineEnabled,
  isAnalyticsReportsEnabled,
  isAnalyticsSnapshotsEnabled,
  memoryAllEvents,
  periodWindowFor,
  resetAnalyticsMemoryStoreForTests,
  resetAnalyticsTelemetryForTests,
  getAnalyticsTelemetrySnapshot,
  setAnalyticsBackend,
  toMetricDate,
} from "@/lib/analytics";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAnalyticsMemoryStoreForTests();
  resetAnalyticsTelemetryForTests();
  setAnalyticsBackend("memory");
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ANALYTICS_ENGINE;
  delete process.env.ANALYTICS_SNAPSHOTS;
  delete process.env.ANALYTICS_REPORTS;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults analytics engine on", () => {
    expect(isAnalyticsEngineEnabled()).toBe(true);
    expect(isAnalyticsSnapshotsEnabled()).toBe(true);
    expect(isAnalyticsReportsEnabled()).toBe(true);
  });

  it("respects ANALYTICS_ENGINE=0", async () => {
    process.env.ANALYTICS_ENGINE = "0";
    expect(isAnalyticsEngineEnabled()).toBe(false);
    const event = await AnalyticsService.record({
      source: "assignments",
      eventType: "assignment.created",
      idempotencyKey: "k1",
    });
    expect(event).toBeNull();
  });
});

describe("recording + idempotency", () => {
  it("records events and dedupes by idempotency key", async () => {
    const a = await AnalyticsService.record({
      source: "marketplace",
      eventType: "assignment.created",
      idempotencyKey: "analytics:assignment.created:ASN-1",
      userId: "u1",
      organizationId: "org1",
    });
    const b = await AnalyticsService.record({
      source: "marketplace",
      eventType: "assignment.created",
      idempotencyKey: "analytics:assignment.created:ASN-1",
      userId: "u1",
    });
    expect(a?.publicId).toBeTruthy();
    expect(b?.id).toBe(a?.id);
    expect(memoryAllEvents()).toHaveLength(1);
    const tel = getAnalyticsTelemetrySnapshot();
    expect(tel.eventsRecorded).toBe(1);
    expect(tel.eventsDuplicate).toBe(1);
  });
});

describe("aggregation", () => {
  it("contributes count metrics across dimensions", () => {
    const contribs = contributionsForEvent({
      eventType: "payment.completed",
      source: "payments",
      organizationId: "org1",
      userId: "u1",
      entityType: "settlement",
      entityId: "SET-1",
      occurredAt: "2026-07-26T12:00:00.000Z",
      metricValue: 5000,
      payload: { amountMinor: 5000 },
    });
    expect(contribs.some((c) => c.metricKey === "payment.completed.count")).toBe(
      true,
    );
    expect(
      contribs.some(
        (c) =>
          c.metricKey === "payment.completed.amount" && c.delta === 5000,
      ),
    ).toBe(true);
    expect(
      contribs.some(
        (c) => c.dimension === "organization" && c.dimensionKey === "org1",
      ),
    ).toBe(true);
  });

  it("aggregates multiple events into daily metrics", async () => {
    await AnalyticsService.record({
      source: "reviews",
      eventType: "review.completed",
      idempotencyKey: "r1",
      occurredAt: "2026-07-26T10:00:00.000Z",
    });
    await AnalyticsService.record({
      source: "reviews",
      eventType: "review.completed",
      idempotencyKey: "r2",
      occurredAt: "2026-07-26T11:00:00.000Z",
    });
    const metrics = await AnalyticsService.queryMetrics({
      dimension: "global",
      metricKey: "review.completed.count",
    });
    expect(metrics[0]?.value).toBe(2);
  });
});

describe("rollups + replay", () => {
  it("rebuilds daily metrics via rollup", async () => {
    await AnalyticsService.record({
      source: "assignments",
      eventType: "assignment.completed",
      idempotencyKey: "a1",
      occurredAt: "2026-07-26T08:00:00.000Z",
    });
    const result = await AnalyticsService.rollup({
      fromDate: "2026-07-26",
      toDateExclusive: "2026-07-27",
    });
    expect(result.metricsWritten).toBeGreaterThan(0);
    const rebuilt = aggregateEventsToDailyMetrics(memoryAllEvents());
    expect(rebuilt.length).toBeGreaterThan(0);
  });
});

describe("snapshots + reports", () => {
  it("generates snapshot and report payloads", async () => {
    await AnalyticsService.record({
      source: "trust",
      eventType: "trust.updated",
      idempotencyKey: "t1",
      occurredAt: new Date().toISOString(),
    });
    const snap = await AnalyticsService.snapshot({
      period: "daily",
      reference: new Date(),
    });
    expect(snap?.modelVersion).toBe(ANALYTICS_MODEL_VERSION);
    expect(snap?.payload.totals).toBeTruthy();

    const report = await AnalyticsService.report({
      reportType: "operations",
      period: "daily",
    });
    expect(report?.status).toBe("ready");
    expect(report?.reportType).toBe("operations");
  });

  it("honors ANALYTICS_SNAPSHOTS=0", async () => {
    process.env.ANALYTICS_SNAPSHOTS = "0";
    const snap = await AnalyticsService.snapshot({ period: "daily" });
    expect(snap).toBeNull();
  });
});

describe("query", () => {
  it("filters events by source and type", async () => {
    await AnalyticsService.record({
      source: "notifications",
      eventType: "notification.sent",
      idempotencyKey: "n1",
    });
    await AnalyticsService.record({
      source: "storage",
      eventType: "storage.uploaded",
      idempotencyKey: "s1",
    });
    const rows = await AnalyticsService.query({
      source: "notifications",
      eventType: "notification.sent",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.eventType).toBe("notification.sent");
  });
});

describe("periods", () => {
  it("builds daily/weekly/monthly/quarterly/yearly windows", () => {
    const ref = new Date("2026-07-26T15:00:00.000Z");
    expect(toMetricDate(ref)).toBe("2026-07-26");
    expect(periodWindowFor("daily", ref).period).toBe("daily");
    expect(periodWindowFor("weekly", ref).period).toBe("weekly");
    expect(periodWindowFor("monthly", ref).periodStart).toContain("2026-07-01");
    expect(periodWindowFor("quarterly", ref).periodStart).toContain(
      "2026-07-01",
    );
    expect(periodWindowFor("yearly", ref).periodStart).toContain("2026-01-01");
  });
});
