/**
 * Report permission filters.
 */

import type { BiReportType } from "@/lib/analytics/reports/types";

const REPORT_PERMISSIONS: Record<BiReportType, string[]> = {
  executive: ["analytics.read", "analytics.admin"],
  campaign: ["analytics.read", "analytics.admin"],
  finance: ["analytics.read", "analytics.admin"],
  trust: ["analytics.read", "analytics.admin"],
  ai: ["analytics.read", "analytics.admin"],
  operations: ["analytics.read", "analytics.admin"],
};

export function canAccessReport(
  type: BiReportType,
  permissions: string[] | undefined,
): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (permissions.includes("*") || permissions.includes("analytics.admin")) {
    return true;
  }
  return REPORT_PERMISSIONS[type].some((p) => permissions.includes(p));
}

/** Strip sensitive finance/AI cost rows for non-admin readers. */
export function filterReportSectionsForPermission<
  T extends { id: string; rows: Array<{ label: string; value: string | number | null }> },
>(
  sections: T[],
  permissions: string[] | undefined,
): { sections: T[]; filtered: boolean } {
  if (!permissions || permissions.length === 0) {
    return { sections, filtered: false };
  }
  if (permissions.includes("*") || permissions.includes("analytics.admin")) {
    return { sections, filtered: false };
  }
  const sensitive = new Set(["finance.cost_detail", "ai.cost_detail"]);
  const next = sections.filter((s) => !sensitive.has(s.id));
  return { sections: next, filtered: next.length !== sections.length };
}
