/**
 * Permission filters for dashboards / widgets.
 */

import type { DashboardType } from "@/lib/analytics/dashboards/types";

const DASHBOARD_PERMISSIONS: Record<DashboardType, string[]> = {
  executive: ["analytics.read", "analytics.admin"],
  operations: ["analytics.read", "analytics.admin"],
  finance: ["analytics.read", "analytics.admin"],
  trust: ["analytics.read", "analytics.admin"],
  ai: ["analytics.read", "analytics.admin"],
  campaign: ["analytics.read", "analytics.admin"],
  worker: ["analytics.read"],
  organization: ["analytics.read", "analytics.admin"],
};

/** Widgets that require analytics.admin (sensitive). */
export const ADMIN_ONLY_WIDGET_IDS = new Set([
  "executive.operational_alerts",
  "finance.wallet_balances",
  "ai.estimated_cost",
  "operations.escalations",
]);

export function canAccessDashboard(
  type: DashboardType,
  permissions: string[] | undefined,
): boolean {
  if (!permissions || permissions.length === 0) return true; // tests / internal
  if (permissions.includes("*") || permissions.includes("analytics.admin")) {
    return true;
  }
  const required = DASHBOARD_PERMISSIONS[type];
  return required.some((p) => permissions.includes(p));
}

export function filterWidgetsByPermission<T extends { id: string }>(
  widgets: T[],
  permissions: string[] | undefined,
): { widgets: T[]; filtered: boolean } {
  if (!permissions || permissions.length === 0) {
    return { widgets, filtered: false };
  }
  if (permissions.includes("*") || permissions.includes("analytics.admin")) {
    return { widgets, filtered: false };
  }
  const next = widgets.filter((w) => !ADMIN_ONLY_WIDGET_IDS.has(w.id));
  return { widgets: next, filtered: next.length !== widgets.length };
}
