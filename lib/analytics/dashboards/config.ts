/**
 * Dashboard runtime flags — Phase 4.3B.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch for all dashboards. Default: on. */
export function isAnalyticsDashboardsEnabled(): boolean {
  if (falsy(process.env.ANALYTICS_DASHBOARDS)) return false;
  if (truthy(process.env.ANALYTICS_DASHBOARDS)) return true;
  return true;
}

/** Executive dashboard. Default: on when master on. */
export function isExecutiveDashboardEnabled(): boolean {
  if (!isAnalyticsDashboardsEnabled()) return false;
  if (falsy(process.env.EXECUTIVE_DASHBOARD)) return false;
  if (truthy(process.env.EXECUTIVE_DASHBOARD)) return true;
  return true;
}

/** Operations dashboard. Default: on when master on. */
export function isOperationsDashboardEnabled(): boolean {
  if (!isAnalyticsDashboardsEnabled()) return false;
  if (falsy(process.env.OPERATIONS_DASHBOARD)) return false;
  if (truthy(process.env.OPERATIONS_DASHBOARD)) return true;
  return true;
}

/** Other dashboard types follow master flag unless explicitly disabled later. */
export function isDashboardTypeEnabled(
  type: import("@/lib/analytics/dashboards/types").DashboardType,
): boolean {
  if (!isAnalyticsDashboardsEnabled()) return false;
  if (type === "executive") return isExecutiveDashboardEnabled();
  if (type === "operations") return isOperationsDashboardEnabled();
  return true;
}

export const DASHBOARD_CACHE_TTL_MS = (() => {
  const raw = Number(process.env.ANALYTICS_DASHBOARD_TTL_MS ?? "60000");
  return Number.isFinite(raw) && raw > 0 ? raw : 60_000;
})();

export { DASHBOARD_MODEL_VERSION } from "@/lib/analytics/dashboards/types";
