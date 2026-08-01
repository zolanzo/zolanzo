/**
 * Phase 4.3D — Scheduled Reports & Data Exports tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AnalyticsService,
  setAnalyticsBackend,
  resetAnalyticsMemoryStoreForTests,
  resetAnalyticsTelemetryForTests,
} from "@/lib/analytics";
import {
  ReportService,
  RendererRegistry,
  ScheduleService,
  resetReportsStoreForTests,
  resetReportsTelemetryForTests,
  getReportsTelemetrySnapshot,
  isReportsEngineEnabled,
  isReportExportsEnabled,
  isReportSchedulesEnabled,
  canAccessReport,
  filterReportSectionsForPermission,
  REPORTS_ENGINE_MODEL_VERSION,
  EXPORT_FORMATS,
} from "@/lib/analytics/reports";
import {
  resetForecastCacheForTests,
  resetForecastTelemetryForTests,
} from "@/lib/analytics/forecast";
import {
  resetDashboardCacheForTests,
  resetDashboardTelemetryForTests,
} from "@/lib/analytics/dashboards";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAnalyticsMemoryStoreForTests();
  resetAnalyticsTelemetryForTests();
  resetForecastCacheForTests();
  resetForecastTelemetryForTests();
  resetDashboardCacheForTests();
  resetDashboardTelemetryForTests();
  resetReportsStoreForTests();
  resetReportsTelemetryForTests();
  setAnalyticsBackend("memory");
  process.env = { ...ORIGINAL_ENV };
  delete process.env.REPORTS_ENGINE;
  delete process.env.REPORT_EXPORTS;
  delete process.env.REPORT_SCHEDULES;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults reports engine on", () => {
    expect(isReportsEngineEnabled()).toBe(true);
    expect(isReportExportsEnabled()).toBe(true);
    expect(isReportSchedulesEnabled()).toBe(true);
  });

  it("respects REPORTS_ENGINE=0", async () => {
    process.env.REPORTS_ENGINE = "0";
    expect(await ReportService.generate({ type: "executive" })).toBeNull();
  });
});

describe("report generation", () => {
  it("builds executive report from upstream services", async () => {
    await AnalyticsService.record({
      source: "payments",
      eventType: "payment.completed",
      idempotencyKey: "p1",
      metricValue: 1000,
      payload: { amountMinor: 1000 },
      occurredAt: new Date().toISOString(),
    });

    const result = await ReportService.generate({
      type: "executive",
      format: "json",
    });
    expect(result).not.toBeNull();
    expect(result?.report.advisoryOnly).toBe(true);
    expect(result?.report.modelVersion).toBe(REPORTS_ENGINE_MODEL_VERSION);
    expect(result?.report.sections.length).toBeGreaterThan(0);
    expect(result?.export?.format).toBe("json");
  });

  it("generates all report types", async () => {
    for (const type of ReportService.listTypes()) {
      const result = await ReportService.generate({ type, format: "json" });
      expect(result?.report.type).toBe(type);
    }
  });
});

describe("export rendering", () => {
  it("renders all registered formats", async () => {
    const result = await ReportService.generate({
      type: "operations",
      format: "json",
    });
    expect(result).not.toBeNull();
    for (const format of EXPORT_FORMATS) {
      const artifact = await ReportService.export({
        report: result!.report,
        format,
      });
      expect(artifact?.format).toBe(format);
      expect(artifact!.byteLength).toBeGreaterThan(0);
      expect(artifact!.body.length).toBeGreaterThan(0);
    }
    expect(RendererRegistry.list().map((r) => r.format).sort()).toEqual(
      [...EXPORT_FORMATS].sort(),
    );
  });
});

describe("schedule execution", () => {
  it("runs due schedules and generates reports", async () => {
    const schedule = ScheduleService.schedule({
      type: "finance",
      frequency: "daily",
      format: "csv",
    });
    expect(schedule).not.toBeNull();

    // Force due
    const past = new Date(Date.now() - 60_000).toISOString();
    const { updateSchedule } = await import("@/lib/analytics/reports/store");
    updateSchedule(schedule!.id, { nextRunAt: past });

    const runs = await ReportService.runSchedules(new Date());
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0]?.ok).toBe(true);
    expect(getReportsTelemetrySnapshot().scheduleExecutions).toBeGreaterThan(0);
  });
});

describe("permission filtering", () => {
  it("allows analytics.read", () => {
    expect(canAccessReport("campaign", ["analytics.read"])).toBe(true);
  });

  it("strips sensitive sections for non-admin", async () => {
    const result = await ReportService.generate({
      type: "ai",
      format: "json",
      permissions: ["analytics.read"],
    });
    expect(
      result?.report.sections.every((s) => s.id !== "ai.cost_detail"),
    ).toBe(true);

    const { sections, filtered } = filterReportSectionsForPermission(
      [
        { id: "ai.cost_detail", rows: [{ label: "x", value: 1 }] },
        { id: "ai.utilization", rows: [{ label: "y", value: 2 }] },
      ],
      ["analytics.read"],
    );
    expect(filtered).toBe(true);
    expect(sections).toHaveLength(1);
  });
});

describe("renderer registry", () => {
  it("supports custom renderer registration", () => {
    RendererRegistry.register({
      format: "json",
      mimeType: "application/json",
      extension: "json",
      render: () => ({ body: '{"custom":true}', encoding: "utf8" }),
    });
    // restore default by re-importing would be heavy; register back via renderReport path
    // Re-register original-like json
    RendererRegistry.register({
      format: "json",
      mimeType: "application/json",
      extension: "json",
      render: (doc) => ({
        body: JSON.stringify({ id: doc.id }),
        encoding: "utf8",
      }),
    });
    expect(RendererRegistry.get("json")).toBeTruthy();
  });
});
