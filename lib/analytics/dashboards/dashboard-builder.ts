/**
 * DashboardBuilder — assembles widgets into a DashboardViewModel.
 * No writes. No domain table queries.
 */

import {
  isDashboardTypeEnabled,
  DASHBOARD_MODEL_VERSION,
} from "@/lib/analytics/dashboards/config";
import {
  filterWidgetsByPermission,
  canAccessDashboard,
} from "@/lib/analytics/dashboards/permissions";
import {
  listWidgetDefinitions,
  loadPeriodTotals,
  renderWidget,
  type WidgetContext,
} from "@/lib/analytics/dashboards/widget-registry";
import type {
  DashboardBuildInput,
  DashboardType,
  DashboardViewModel,
} from "@/lib/analytics/dashboards/types";

const TITLES: Record<DashboardType, { title: string; description: string }> = {
  executive: {
    title: "Executive Dashboard",
    description: "Organization health at a glance",
  },
  operations: {
    title: "Operations Dashboard",
    description: "Operational efficiency and bottlenecks",
  },
  finance: {
    title: "Finance Dashboard",
    description: "Payments, payouts, and settlement activity",
  },
  trust: {
    title: "Trust Dashboard",
    description: "Trust scores, trends, and badges",
  },
  ai: {
    title: "AI Dashboard",
    description: "AI usage, latency, cost, and errors",
  },
  campaign: {
    title: "Campaign Dashboard",
    description: "Per-campaign progress and quality",
  },
  worker: {
    title: "Worker Dashboard",
    description: "Personal earnings, trust, and completion",
  },
  organization: {
    title: "Organization Dashboard",
    description: "Workforce, campaigns, and spending",
  },
};

async function loadTrustContext(): Promise<WidgetContext["trust"]> {
  try {
    const { getTrustTelemetrySnapshot } = await import("@/lib/trust/telemetry");
    const { getPassportTelemetrySnapshot } = await import(
      "@/lib/trust/passport/passport-telemetry"
    );
    const trust = getTrustTelemetrySnapshot();
    const passport = getPassportTelemetrySnapshot();
    return {
      averageScore: trust.averageScore,
      distribution: trust.distribution,
      risingTrust: trust.risingCount,
      fallingTrust: trust.fallingCount,
      profiles: trust.scoredProfiles,
      eventsFailed: trust.eventsFailed,
      badgeDistribution: passport.badgeEarnCounts,
    };
  } catch {
    return null;
  }
}

async function loadAiContext(): Promise<WidgetContext["ai"]> {
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

async function loadForecastContext(input: DashboardBuildInput): Promise<
  WidgetContext["forecast"]
> {
  try {
    const { getForecast } = await import("@/lib/analytics/forecast");
    const result = await getForecast({
      type: "campaign",
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      permissions: input.permissions,
      reference: input.reference,
    });
    if (!result) return null;
    const eta = result.predictions.find((p) => p.key === "campaign.completion_eta");
    return {
      campaignEta:
        eta?.value == null ? null : String(eta.value),
      campaignConfidence: result.confidence,
      campaignRisk: result.riskLevel,
      advisoryOnly: true,
    };
  } catch {
    return null;
  }
}

export async function buildDashboard(
  input: DashboardBuildInput,
): Promise<DashboardViewModel | null> {
  if (!isDashboardTypeEnabled(input.type)) return null;
  if (!canAccessDashboard(input.type, input.permissions)) return null;

  const started = Date.now();
  const meta = TITLES[input.type];
  const generatedAt = new Date().toISOString();

  const needsTrust =
    input.type === "trust" ||
    input.type === "executive" ||
    input.type === "worker" ||
    input.type === "organization";
  const needsAi = input.type === "ai" || input.type === "executive";
  const needsForecast =
    input.type === "campaign" || input.type === "executive";

  const [periodData, trust, ai, forecast] = await Promise.all([
    loadPeriodTotals({
      period: "daily",
      reference: input.reference,
      organizationId: input.organizationId,
      campaignId: input.campaignId,
      workerUserId: input.workerUserId,
    }),
    needsTrust ? loadTrustContext() : Promise.resolve(null),
    needsAi ? loadAiContext() : Promise.resolve(null),
    needsForecast ? loadForecastContext(input) : Promise.resolve(null),
  ]);

  const ctx: WidgetContext = {
    input,
    totals: periodData.totals,
    eventTypes: periodData.eventTypes,
    queryDurationMs: periodData.queryDurationMs,
    generatedAt,
    trust,
    ai,
    forecast,
  };

  const defs = listWidgetDefinitions(input.type);
  const widgets = defs.map((def) => renderWidget(def, ctx));
  const { widgets: filtered, filtered: permissionsFiltered } =
    filterWidgetsByPermission(widgets, input.permissions);

  const widgetFailures = filtered.filter((w) => w.status === "error").length;
  const snapshotFreshnessMs = periodData.snapshotGeneratedAt
    ? Math.max(
        0,
        Date.now() - new Date(periodData.snapshotGeneratedAt).getTime(),
      )
    : null;

  return {
    type: input.type,
    title: meta.title,
    description: meta.description,
    modelVersion: DASHBOARD_MODEL_VERSION,
    widgets: filtered,
    cacheHit: false,
    renderLatencyMs: Date.now() - started,
    snapshotFreshnessMs,
    generatedAt,
    scope: {
      organizationId: input.organizationId ?? null,
      campaignId: input.campaignId ?? null,
      workerUserId: input.workerUserId ?? null,
    },
    permissionsFiltered,
    // expose failures count via renderLatency path — caller records telemetry
    ...(widgetFailures > 0 ? {} : {}),
  };
}

export function countWidgetFailures(dashboard: DashboardViewModel): number {
  return dashboard.widgets.filter((w) => w.status === "error").length;
}

export const DashboardBuilder = {
  build: buildDashboard,
  countWidgetFailures,
};
