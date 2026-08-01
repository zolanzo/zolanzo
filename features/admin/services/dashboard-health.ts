/**
 * Admin Dashboard Health — presentation layer observability (4.3B).
 */

import "server-only";

import {
  isAnalyticsDashboardsEnabled,
  isExecutiveDashboardEnabled,
  isOperationsDashboardEnabled,
  DASHBOARD_MODEL_VERSION,
  DASHBOARD_CACHE_TTL_MS,
} from "@/lib/analytics/dashboards/config";
import { getDashboardCacheStats } from "@/lib/analytics/dashboards/cache";
import { getDashboardTelemetrySnapshot } from "@/lib/analytics/dashboards/telemetry";
import { listWidgetDefinitions } from "@/lib/analytics/dashboards/widget-registry";

export type DashboardHealthSnapshot = {
  dashboardsEnabled: boolean;
  executiveEnabled: boolean;
  operationsEnabled: boolean;
  modelVersion: string;
  cacheTtlMs: number;
  builds: number;
  cacheHitRate: number;
  cacheSize: number;
  averageRenderLatencyMs: number;
  averageQueryDurationMs: number;
  widgetFailures: number;
  widgetDefinitions: number;
  byDashboard: Record<string, number>;
  snapshotFreshnessProxyMs: number | null;
  lastRenderLatencyMs: number | null;
  generatedAt: string;
};

export async function getDashboardHealthSnapshot(): Promise<DashboardHealthSnapshot> {
  const telemetry = getDashboardTelemetrySnapshot();
  const cache = getDashboardCacheStats();

  return {
    dashboardsEnabled: isAnalyticsDashboardsEnabled(),
    executiveEnabled: isExecutiveDashboardEnabled(),
    operationsEnabled: isOperationsDashboardEnabled(),
    modelVersion: DASHBOARD_MODEL_VERSION,
    cacheTtlMs: DASHBOARD_CACHE_TTL_MS,
    builds: telemetry.builds,
    cacheHitRate: Math.round(telemetry.cacheHitRate * 1000) / 1000,
    cacheSize: cache.size,
    averageRenderLatencyMs: telemetry.averageRenderLatencyMs,
    averageQueryDurationMs: telemetry.averageQueryDurationMs,
    widgetFailures: telemetry.widgetFailures,
    widgetDefinitions: listWidgetDefinitions().length,
    byDashboard: telemetry.byDashboard,
    snapshotFreshnessProxyMs: telemetry.lastAt
      ? Math.max(0, Date.now() - new Date(telemetry.lastAt).getTime())
      : null,
    lastRenderLatencyMs: telemetry.lastRenderLatencyMs,
    generatedAt: new Date().toISOString(),
  };
}
