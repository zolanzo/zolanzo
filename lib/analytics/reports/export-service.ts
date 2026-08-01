/**
 * ExportService — render + store export artifacts.
 */

import { isReportExportsEnabled } from "@/lib/analytics/reports/config";
import { renderReport } from "@/lib/analytics/reports/renderer-registry";
import { storeArtifact } from "@/lib/analytics/reports/store";
import { recordReportExport } from "@/lib/analytics/reports/telemetry";
import type {
  ExportArtifact,
  ExportFormat,
  ReportDocument,
} from "@/lib/analytics/reports/types";

export function exportReport(
  doc: ReportDocument,
  format: ExportFormat,
): ExportArtifact | null {
  if (!isReportExportsEnabled()) return null;
  try {
    const artifact = renderReport(doc, format);
    storeArtifact(doc.id, artifact);
    recordReportExport({
      format,
      success: true,
      durationMs: artifact.durationMs,
      byteLength: artifact.byteLength,
    });
    return artifact;
  } catch {
    recordReportExport({
      format,
      success: false,
      durationMs: 0,
      byteLength: 0,
    });
    return null;
  }
}

export const ExportService = {
  export: exportReport,
};
