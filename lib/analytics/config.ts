/**
 * Analytics Foundation runtime flags — Phase 4.3A.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

/** Master switch. Default: on. */
export function isAnalyticsEngineEnabled(): boolean {
  if (falsy(process.env.ANALYTICS_ENGINE)) return false;
  if (truthy(process.env.ANALYTICS_ENGINE)) return true;
  return true;
}

/** Snapshot generation. Default: on. */
export function isAnalyticsSnapshotsEnabled(): boolean {
  if (falsy(process.env.ANALYTICS_SNAPSHOTS)) return false;
  if (truthy(process.env.ANALYTICS_SNAPSHOTS)) return true;
  return true;
}

/** Report generation. Default: on. */
export function isAnalyticsReportsEnabled(): boolean {
  if (falsy(process.env.ANALYTICS_REPORTS)) return false;
  if (truthy(process.env.ANALYTICS_REPORTS)) return true;
  return true;
}

export { ANALYTICS_MODEL_VERSION } from "@/lib/analytics/types";
