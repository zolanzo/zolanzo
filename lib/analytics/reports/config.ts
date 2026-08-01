/**
 * Reports Engine runtime flags — Phase 4.3D.
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
export function isReportsEngineEnabled(): boolean {
  if (falsy(process.env.REPORTS_ENGINE)) return false;
  if (truthy(process.env.REPORTS_ENGINE)) return true;
  return true;
}

/** Export rendering. Default: on when engine on. */
export function isReportExportsEnabled(): boolean {
  if (!isReportsEngineEnabled()) return false;
  if (falsy(process.env.REPORT_EXPORTS)) return false;
  if (truthy(process.env.REPORT_EXPORTS)) return true;
  return true;
}

/** Schedule execution. Default: on when engine on. */
export function isReportSchedulesEnabled(): boolean {
  if (!isReportsEngineEnabled()) return false;
  if (falsy(process.env.REPORT_SCHEDULES)) return false;
  if (truthy(process.env.REPORT_SCHEDULES)) return true;
  return true;
}

export { REPORTS_ENGINE_MODEL_VERSION } from "@/lib/analytics/reports/types";
