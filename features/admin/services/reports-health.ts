/**
 * Admin Reports Health — BI deliverables observability (4.3D).
 */

import "server-only";

import {
  isReportsEngineEnabled,
  isReportExportsEnabled,
  isReportSchedulesEnabled,
  REPORTS_ENGINE_MODEL_VERSION,
} from "@/lib/analytics/reports/config";
import { getReportsTelemetrySnapshot } from "@/lib/analytics/reports/telemetry";
import { listRenderers } from "@/lib/analytics/reports/renderer-registry";
import { listSchedules, totalStoredBytes } from "@/lib/analytics/reports/store";

export type ReportsHealthSnapshot = {
  reportsEngineEnabled: boolean;
  exportsEnabled: boolean;
  schedulesEnabled: boolean;
  modelVersion: string;
  reportsGenerated: number;
  exportsGenerated: number;
  averageExportDurationMs: number;
  averageBuildDurationMs: number;
  queueDepth: number;
  scheduleExecutions: number;
  schedulesConfigured: number;
  failures: number;
  errorRate: number;
  storageBytes: number;
  renderers: string[];
  byType: Record<string, number>;
  byFormat: Record<string, number>;
  generatedAt: string;
};

export async function getReportsHealthSnapshot(): Promise<ReportsHealthSnapshot> {
  const telemetry = getReportsTelemetrySnapshot();
  return {
    reportsEngineEnabled: isReportsEngineEnabled(),
    exportsEnabled: isReportExportsEnabled(),
    schedulesEnabled: isReportSchedulesEnabled(),
    modelVersion: REPORTS_ENGINE_MODEL_VERSION,
    reportsGenerated: telemetry.reportsGenerated,
    exportsGenerated: telemetry.exportsGenerated,
    averageExportDurationMs: telemetry.averageExportDurationMs,
    averageBuildDurationMs: telemetry.averageBuildDurationMs,
    queueDepth: telemetry.queueDepth,
    scheduleExecutions: telemetry.scheduleExecutions,
    schedulesConfigured: listSchedules().length,
    failures: telemetry.failures,
    errorRate: Math.round(telemetry.errorRate * 1000) / 1000,
    storageBytes: Math.max(telemetry.storageBytes, totalStoredBytes()),
    renderers: listRenderers().map((r) => r.format),
    byType: telemetry.byType,
    byFormat: telemetry.byFormat,
    generatedAt: new Date().toISOString(),
  };
}
