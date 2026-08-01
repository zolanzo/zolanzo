/**
 * Scheduled Reports & Data Exports — Phase 4.3D types.
 * Reports never compute metrics or mutate domain state.
 */

export const REPORTS_ENGINE_MODEL_VERSION = "reports-engine/1.0.0";

export const BI_REPORT_TYPES = [
  "executive",
  "campaign",
  "finance",
  "trust",
  "ai",
  "operations",
] as const;

export type BiReportType = (typeof BI_REPORT_TYPES)[number];

export const EXPORT_FORMATS = ["pdf", "csv", "xlsx", "json"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const REPORT_SCHEDULE_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "manual",
] as const;

export type ReportScheduleFrequency =
  (typeof REPORT_SCHEDULE_FREQUENCIES)[number];

export type ReportSection = {
  id: string;
  title: string;
  summary?: string | null;
  rows: Array<{ label: string; value: string | number | null; unit?: string | null }>;
  notes?: string[];
};

export type ReportDocument = {
  id: string;
  publicId: string;
  type: BiReportType;
  title: string;
  description: string;
  sections: ReportSection[];
  modelVersion: string;
  generatedAt: string;
  scope: {
    organizationId?: string | null;
    campaignId?: string | null;
  };
  sources: string[];
  advisoryOnly: true;
};

export type ReportRequest = {
  type: BiReportType;
  organizationId?: string | null;
  campaignId?: string | null;
  permissions?: string[];
  format?: ExportFormat;
  reference?: Date;
};

export type ExportArtifact = {
  format: ExportFormat;
  mimeType: string;
  filename: string;
  /** UTF-8 text or base64 for binary-ish placeholders */
  encoding: "utf8" | "base64";
  body: string;
  byteLength: number;
  durationMs: number;
  reportId: string;
  generatedAt: string;
};

export type ReportSchedule = {
  id: string;
  publicId: string;
  type: BiReportType;
  frequency: ReportScheduleFrequency;
  format: ExportFormat;
  organizationId?: string | null;
  campaignId?: string | null;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastStatus: "idle" | "success" | "failed";
  createdAt: string;
};

export type ScheduleRunResult = {
  scheduleId: string;
  ok: boolean;
  reportId: string | null;
  exportFormat: ExportFormat | null;
  errorMessage: string | null;
  durationMs: number;
  executedAt: string;
};

export type ReportsHealthCounters = {
  reportsGenerated: number;
  exportsGenerated: number;
  scheduleExecutions: number;
  failures: number;
  totalExportDurationMs: number;
  totalBuildDurationMs: number;
  lastExportDurationMs: number | null;
  lastAt: string | null;
  byType: Record<string, number>;
  byFormat: Record<string, number>;
  storageBytes: number;
  queueDepth: number;
};
