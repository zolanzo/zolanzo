/**
 * ReportService — public API for BI reports & exports.
 * Never computes metrics. Never mutates domain state.
 */

import {
  isReportsEngineEnabled,
  isReportExportsEnabled,
} from "@/lib/analytics/reports/config";
import { buildReport } from "@/lib/analytics/reports/report-builder";
import { exportReport } from "@/lib/analytics/reports/export-service";
import {
  scheduleReport,
  listReportSchedules,
  runDueSchedules,
} from "@/lib/analytics/reports/schedule-service";
import { storeReport, listStoredReports, listArtifacts } from "@/lib/analytics/reports/store";
import { recordReportBuild } from "@/lib/analytics/reports/telemetry";
import { canAccessReport } from "@/lib/analytics/reports/permissions";
import { BI_REPORT_TYPES } from "@/lib/analytics/reports/types";
import type {
  BiReportType,
  ExportArtifact,
  ExportFormat,
  ReportDocument,
  ReportRequest,
  ReportSchedule,
  ScheduleRunResult,
} from "@/lib/analytics/reports/types";

export type GenerateReportResult = {
  report: ReportDocument;
  export: ExportArtifact | null;
};

export async function generateReport(
  request: ReportRequest,
): Promise<GenerateReportResult | null> {
  if (!isReportsEngineEnabled()) return null;
  if (!canAccessReport(request.type, request.permissions)) return null;

  const started = Date.now();
  try {
    const built = await buildReport(request);
    if (!built) {
      recordReportBuild({
        type: request.type,
        success: false,
        durationMs: Date.now() - started,
      });
      return null;
    }
    const report = storeReport(built);
    recordReportBuild({
      type: request.type,
      success: true,
      durationMs: Date.now() - started,
    });

    const format: ExportFormat = request.format ?? "json";
    const artifact =
      isReportExportsEnabled() ? exportReport(report, format) : null;

    return { report, export: artifact };
  } catch {
    recordReportBuild({
      type: request.type,
      success: false,
      durationMs: Date.now() - started,
    });
    return null;
  }
}

export async function exportExistingReport(params: {
  report: ReportDocument;
  format: ExportFormat;
}): Promise<ExportArtifact | null> {
  if (!isReportsEngineEnabled() || !isReportExportsEnabled()) return null;
  return exportReport(params.report, params.format);
}

export function listReports(): ReportDocument[] {
  return listStoredReports();
}

export function listReportExports(reportId?: string): ExportArtifact[] {
  return listArtifacts(reportId);
}

export function listAvailableReportTypes(
  permissions?: string[],
): BiReportType[] {
  if (!isReportsEngineEnabled()) return [];
  return BI_REPORT_TYPES.filter((t) => canAccessReport(t, permissions));
}

export async function executeDueSchedules(
  now?: Date,
): Promise<ScheduleRunResult[]> {
  return runDueSchedules({
    now,
    generate: async (schedule) => {
      const result = await generateReport({
        type: schedule.type,
        organizationId: schedule.organizationId,
        campaignId: schedule.campaignId,
        format: schedule.format,
      });
      if (!result) {
        return {
          ok: false,
          reportId: null,
          errorMessage: "Report generation failed or disabled",
        };
      }
      return { ok: true, reportId: result.report.id };
    },
  });
}

export const ReportService = {
  generate: generateReport,
  export: exportExistingReport,
  list: listReports,
  listExports: listReportExports,
  listTypes: listAvailableReportTypes,
  schedule: scheduleReport,
  listSchedules: listReportSchedules,
  runSchedules: executeDueSchedules,
};

export type { ReportSchedule };
