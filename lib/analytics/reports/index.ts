/**
 * Scheduled Reports & Data Exports — Phase 4.3D exports.
 */

export {
  REPORTS_ENGINE_MODEL_VERSION,
  BI_REPORT_TYPES,
  EXPORT_FORMATS,
  REPORT_SCHEDULE_FREQUENCIES,
  type BiReportType,
  type ExportFormat,
  type ReportScheduleFrequency,
  type ReportDocument,
  type ReportSection,
  type ReportRequest,
  type ExportArtifact,
  type ReportSchedule,
  type ScheduleRunResult,
} from "@/lib/analytics/reports/types";

export {
  isReportsEngineEnabled,
  isReportExportsEnabled,
  isReportSchedulesEnabled,
} from "@/lib/analytics/reports/config";

export {
  ReportService,
  generateReport,
  exportExistingReport,
  listReports,
  listAvailableReportTypes,
  executeDueSchedules,
} from "@/lib/analytics/reports/report-service";

export { ReportBuilder, buildReport } from "@/lib/analytics/reports/report-builder";

export {
  RendererRegistry,
  getRenderer,
  listRenderers,
  registerRenderer,
  renderReport,
} from "@/lib/analytics/reports/renderer-registry";

export { ExportService, exportReport } from "@/lib/analytics/reports/export-service";

export {
  ScheduleService,
  scheduleReport,
  listReportSchedules,
  runDueSchedules,
} from "@/lib/analytics/reports/schedule-service";

export {
  canAccessReport,
  filterReportSectionsForPermission,
} from "@/lib/analytics/reports/permissions";

export {
  getReportsTelemetrySnapshot,
  resetReportsTelemetryForTests,
} from "@/lib/analytics/reports/telemetry";

export { resetReportsStoreForTests } from "@/lib/analytics/reports/store";
