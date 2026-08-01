/**
 * Phase 4.3B — Executive Dashboards tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AnalyticsService,
  setAnalyticsBackend,
  resetAnalyticsMemoryStoreForTests,
  resetAnalyticsTelemetryForTests,
} from "@/lib/analytics";
import {
  DashboardService,
  WidgetRegistry,
  WidgetRenderer,
  DashboardCache,
  resetDashboardCacheForTests,
  resetDashboardTelemetryForTests,
  getDashboardTelemetrySnapshot,
  isAnalyticsDashboardsEnabled,
  isExecutiveDashboardEnabled,
  isOperationsDashboardEnabled,
  canAccessDashboard,
  filterWidgetsByPermission,
  DASHBOARD_MODEL_VERSION,
} from "@/lib/analytics/dashboards";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAnalyticsMemoryStoreForTests();
  resetAnalyticsTelemetryForTests();
  resetDashboardCacheForTests();
  resetDashboardTelemetryForTests();
  setAnalyticsBackend("memory");
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ANALYTICS_DASHBOARDS;
  delete process.env.EXECUTIVE_DASHBOARD;
  delete process.env.OPERATIONS_DASHBOARD;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults dashboards on", () => {
    expect(isAnalyticsDashboardsEnabled()).toBe(true);
    expect(isExecutiveDashboardEnabled()).toBe(true);
    expect(isOperationsDashboardEnabled()).toBe(true);
  });

  it("respects ANALYTICS_DASHBOARDS=0", async () => {
    process.env.ANALYTICS_DASHBOARDS = "0";
    const dash = await DashboardService.get({ type: "executive" });
    expect(dash).toBeNull();
  });

  it("respects EXECUTIVE_DASHBOARD=0", async () => {
    process.env.EXECUTIVE_DASHBOARD = "0";
    expect(await DashboardService.get({ type: "executive" })).toBeNull();
    expect(await DashboardService.get({ type: "finance" })).not.toBeNull();
  });
});

describe("widget registry", () => {
  it("lists widgets per dashboard type", () => {
    const executive = WidgetRegistry.list("executive");
    expect(executive.length).toBeGreaterThan(5);
    expect(executive.every((w) => w.dashboards.includes("executive"))).toBe(
      true,
    );
    const ai = WidgetRegistry.list("ai");
    expect(ai.some((w) => w.id === "ai.requests")).toBe(true);
  });
});

describe("dashboard generation", () => {
  it("builds executive dashboard from AnalyticsService metrics", async () => {
    await AnalyticsService.record({
      source: "campaigns",
      eventType: "campaign.created",
      idempotencyKey: "c1",
      occurredAt: new Date().toISOString(),
    });
    await AnalyticsService.record({
      source: "payments",
      eventType: "payment.completed",
      idempotencyKey: "p1",
      metricValue: 2500,
      payload: { amountMinor: 2500 },
      occurredAt: new Date().toISOString(),
    });

    const dash = await DashboardService.get({ type: "executive" });
    expect(dash).not.toBeNull();
    expect(dash?.modelVersion).toBe(DASHBOARD_MODEL_VERSION);
    expect(dash?.widgets.length).toBeGreaterThan(0);
    expect(dash?.cacheHit).toBe(false);

    const rendered = WidgetRenderer.render(dash!);
    expect(rendered[0]?.title).toBeTruthy();
  });

  it("builds all dashboard types", async () => {
    for (const type of [
      "executive",
      "operations",
      "finance",
      "trust",
      "ai",
      "campaign",
      "worker",
      "organization",
    ] as const) {
      const dash = await DashboardService.get({ type, refresh: true });
      expect(dash?.type).toBe(type);
      expect(dash?.widgets.length).toBeGreaterThan(0);
    }
  });
});

describe("cache behavior", () => {
  it("hits cache on second get and refreshes on demand", async () => {
    const first = await DashboardService.get({ type: "operations" });
    const second = await DashboardService.get({ type: "operations" });
    expect(first?.cacheHit).toBe(false);
    expect(second?.cacheHit).toBe(true);

    const refreshed = await DashboardService.refresh({ type: "operations" });
    expect(refreshed?.cacheHit).toBe(false);

    const stats = DashboardCache.stats();
    expect(stats.hits).toBeGreaterThan(0);
    expect(getDashboardTelemetrySnapshot().builds).toBeGreaterThanOrEqual(3);
  });
});

describe("permission filtering", () => {
  it("allows analytics.read for dashboards", () => {
    expect(canAccessDashboard("worker", ["analytics.read"])).toBe(true);
    expect(canAccessDashboard("executive", ["analytics.read"])).toBe(true);
    expect(canAccessDashboard("finance", [])).toBe(true);
  });

  it("strips admin-only widgets without analytics.admin", async () => {
    const dash = await DashboardService.get({
      type: "executive",
      permissions: ["analytics.read"],
      refresh: true,
    });
    expect(dash?.permissionsFiltered).toBe(true);
    expect(
      dash?.widgets.some((w) => w.id === "executive.operational_alerts"),
    ).toBe(false);

    const { widgets, filtered } = filterWidgetsByPermission(
      [{ id: "executive.operational_alerts" }, { id: "executive.revenue" }],
      ["analytics.read"],
    );
    expect(filtered).toBe(true);
    expect(widgets).toHaveLength(1);
  });
});

describe("snapshot rendering", () => {
  it("exposes campaign ETA from Forecast Engine when available", async () => {
    const dash = await DashboardService.get({
      type: "campaign",
      refresh: true,
    });
    const eta = dash?.widgets.find((w) => w.id === "campaign.eta_forecast");
    expect(eta?.kind).toBe("kpi");
    // Empty when no completion pace; still advisory-capable widget
    expect(["ok", "empty"]).toContain(eta?.status);
  });
});
