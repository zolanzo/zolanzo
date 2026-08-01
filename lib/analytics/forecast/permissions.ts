/**
 * Forecast permission filters.
 */

import type { ForecastType } from "@/lib/analytics/forecast/types";

const FORECAST_PERMISSIONS: Record<ForecastType, string[]> = {
  campaign: ["analytics.read", "analytics.admin"],
  workforce: ["analytics.read", "analytics.admin"],
  finance: ["analytics.read", "analytics.admin"],
  trust: ["analytics.read", "analytics.admin"],
  reviews: ["analytics.read", "analytics.admin"],
  ai_operations: ["analytics.read", "analytics.admin"],
};

/** Sensitive finance / AI cost recommendations require admin. */
export const ADMIN_ONLY_RECOMMENDATION_IDS = new Set([
  "finance.budget_settlement_funds",
  "ai.control_spend",
]);

export function canAccessForecast(
  type: ForecastType,
  permissions: string[] | undefined,
): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (permissions.includes("*") || permissions.includes("analytics.admin")) {
    return true;
  }
  return FORECAST_PERMISSIONS[type].some((p) => permissions.includes(p));
}

export function filterRecommendationsByPermission<
  T extends { id: string },
>(
  recommendations: T[],
  permissions: string[] | undefined,
): { recommendations: T[]; filtered: boolean } {
  if (!permissions || permissions.length === 0) {
    return { recommendations, filtered: false };
  }
  if (permissions.includes("*") || permissions.includes("analytics.admin")) {
    return { recommendations, filtered: false };
  }
  const next = recommendations.filter(
    (r) => !ADMIN_ONLY_RECOMMENDATION_IDS.has(r.id),
  );
  return {
    recommendations: next,
    filtered: next.length !== recommendations.length,
  };
}
