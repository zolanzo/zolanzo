/**
 * ScheduleService — recurring report generation (no domain mutations).
 */

import { isReportSchedulesEnabled } from "@/lib/analytics/reports/config";
import {
  createSchedule,
  listSchedules,
  updateSchedule,
  recordScheduleRun,
  listScheduleRuns,
} from "@/lib/analytics/reports/store";
import { recordScheduleExecution, setReportQueueDepth } from "@/lib/analytics/reports/telemetry";
import type {
  BiReportType,
  ExportFormat,
  ReportSchedule,
  ReportScheduleFrequency,
  ScheduleRunResult,
} from "@/lib/analytics/reports/types";

export type CreateScheduleInput = {
  type: BiReportType;
  frequency: Exclude<ReportScheduleFrequency, "manual">;
  format?: ExportFormat;
  organizationId?: string | null;
  campaignId?: string | null;
  enabled?: boolean;
  reference?: Date;
};

function nextRunAt(
  frequency: ReportScheduleFrequency,
  from: Date = new Date(),
): string {
  const d = new Date(from.getTime());
  if (frequency === "daily") d.setUTCDate(d.getUTCDate() + 1);
  else if (frequency === "weekly") d.setUTCDate(d.getUTCDate() + 7);
  else if (frequency === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else if (frequency === "quarterly") d.setUTCMonth(d.getUTCMonth() + 3);
  return d.toISOString();
}

export function scheduleReport(input: CreateScheduleInput): ReportSchedule | null {
  if (!isReportSchedulesEnabled()) return null;
  return createSchedule({
    type: input.type,
    frequency: input.frequency,
    format: input.format ?? "json",
    organizationId: input.organizationId ?? null,
    campaignId: input.campaignId ?? null,
    enabled: input.enabled ?? true,
    nextRunAt: nextRunAt(input.frequency, input.reference ?? new Date()),
  });
}

export function listReportSchedules(): ReportSchedule[] {
  return listSchedules();
}

export async function runDueSchedules(params?: {
  now?: Date;
  generate?: (schedule: ReportSchedule) => Promise<{
    ok: boolean;
    reportId: string | null;
    errorMessage?: string | null;
  }>;
}): Promise<ScheduleRunResult[]> {
  if (!isReportSchedulesEnabled()) return [];
  const now = params?.now ?? new Date();
  const due = listSchedules().filter(
    (s) => s.enabled && new Date(s.nextRunAt) <= now,
  );
  setReportQueueDepth(due.length);

  const results: ScheduleRunResult[] = [];
  for (const schedule of due) {
    const started = Date.now();
    try {
      const generated = params?.generate
        ? await params.generate(schedule)
        : { ok: false, reportId: null, errorMessage: "No generator bound" };
      const run: ScheduleRunResult = {
        scheduleId: schedule.id,
        ok: generated.ok,
        reportId: generated.reportId,
        exportFormat: schedule.format,
        errorMessage: generated.errorMessage ?? null,
        durationMs: Date.now() - started,
        executedAt: now.toISOString(),
      };
      recordScheduleRun(run);
      recordScheduleExecution(run.ok);
      updateSchedule(schedule.id, {
        lastRunAt: now.toISOString(),
        lastStatus: run.ok ? "success" : "failed",
        nextRunAt: nextRunAt(schedule.frequency, now),
      });
      results.push(run);
    } catch (error) {
      const run: ScheduleRunResult = {
        scheduleId: schedule.id,
        ok: false,
        reportId: null,
        exportFormat: schedule.format,
        errorMessage: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - started,
        executedAt: now.toISOString(),
      };
      recordScheduleRun(run);
      recordScheduleExecution(false);
      updateSchedule(schedule.id, {
        lastRunAt: now.toISOString(),
        lastStatus: "failed",
        nextRunAt: nextRunAt(schedule.frequency, now),
      });
      results.push(run);
    }
  }
  setReportQueueDepth(0);
  return results;
}

export function getScheduleRunHistory(): ScheduleRunResult[] {
  return listScheduleRuns();
}

export const ScheduleService = {
  schedule: scheduleReport,
  list: listReportSchedules,
  runDue: runDueSchedules,
  history: getScheduleRunHistory,
};
