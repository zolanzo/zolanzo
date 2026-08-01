/**
 * DashboardService — public API for executive dashboards.
 * Presentation only. AnalyticsService / Trust / AI telemetry are data sources.
 */

import {
  isAnalyticsDashboardsEnabled,
  isDashboardTypeEnabled,
} from "@/lib/analytics/dashboards/config";
import {
  DashboardCache,
  dashboardCacheKey,
  invalidateDashboardCache,
} from "@/lib/analytics/dashboards/cache";
import {
  buildDashboard,
  countWidgetFailures,
} from "@/lib/analytics/dashboards/dashboard-builder";
import { recordDashboardBuild } from "@/lib/analytics/dashboards/telemetry";
import type {
  DashboardBuildInput,
  DashboardType,
  DashboardViewModel,
} from "@/lib/analytics/dashboards/types";
import { DASHBOARD_TYPES } from "@/lib/analytics/dashboards/types";

export async function getDashboard(
  input: DashboardBuildInput,
): Promise<DashboardViewModel | null> {
  if (!isAnalyticsDashboardsEnabled()) return null;
  if (!isDashboardTypeEnabled(input.type)) return null;

  const permissionsKey = (input.permissions ?? []).slice().sort().join(",");
  const key = dashboardCacheKey({
    type: input.type,
    organizationId: input.organizationId,
    campaignId: input.campaignId,
    workerUserId: input.workerUserId,
    permissionsKey,
  });

  if (!input.refresh) {
    const cached = DashboardCache.get(key);
    if (cached) {
      recordDashboardBuild({
        type: input.type,
        cacheHit: true,
        renderLatencyMs: cached.renderLatencyMs,
        queryDurationMs: 0,
        widgetFailures: countWidgetFailures(cached),
      });
      return cached;
    }
  }

  const built = await buildDashboard(input);
  if (!built) return null;

  const queryDurationMs = built.widgets.reduce(
    (max, w) => Math.max(max, w.queryDurationMs),
    0,
  );
  recordDashboardBuild({
    type: input.type,
    cacheHit: false,
    renderLatencyMs: built.renderLatencyMs,
    queryDurationMs,
    widgetFailures: countWidgetFailures(built),
  });

  DashboardCache.set(key, built);
  return built;
}

export async function refreshDashboard(
  input: Omit<DashboardBuildInput, "refresh">,
): Promise<DashboardViewModel | null> {
  return getDashboard({ ...input, refresh: true });
}

export function listAvailableDashboards(
  permissions?: string[],
): DashboardType[] {
  if (!isAnalyticsDashboardsEnabled()) return [];
  return DASHBOARD_TYPES.filter((type) => {
    if (!isDashboardTypeEnabled(type)) return false;
    if (!permissions || permissions.length === 0) return true;
    if (permissions.includes("*") || permissions.includes("analytics.admin")) {
      return true;
    }
    return permissions.includes("analytics.read");
  });
}

export const DashboardService = {
  get: getDashboard,
  refresh: refreshDashboard,
  list: listAvailableDashboards,
  invalidateCache: invalidateDashboardCache,
};

/** Thin renderer contract for UI layers. */
export function renderDashboardWidgets(dashboard: DashboardViewModel): Array<{
  id: string;
  title: string;
  kind: string;
  primary: number | string | null;
  status: string;
  series?: Array<{ label: string; value: number }>;
  items?: Array<{ label: string; value: string | number }>;
}> {
  return dashboard.widgets.map((w) => ({
    id: w.id,
    title: w.title,
    kind: w.kind,
    primary: w.value.primary,
    status: w.status,
    series: w.series,
    items: w.items,
  }));
}

export const WidgetRenderer = {
  render: renderDashboardWidgets,
};
