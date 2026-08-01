/**
 * In-memory report / export / schedule store (tests + local).
 * Production can swap for Prisma-backed storage later without API changes.
 */

import type {
  ExportArtifact,
  ReportDocument,
  ReportSchedule,
  ScheduleRunResult,
} from "@/lib/analytics/reports/types";

let seq = 0;
const reports = new Map<string, ReportDocument>();
const artifacts = new Map<string, ExportArtifact[]>();
const schedules = new Map<string, ReportSchedule>();
const scheduleRuns: ScheduleRunResult[] = [];

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

function nextPublicId(prefix: string): string {
  seq += 1;
  const body = seq.toString(36).toUpperCase().padStart(6, "2").slice(-6);
  return `${prefix}-${body}`;
}

export function resetReportsStoreForTests(): void {
  seq = 0;
  reports.clear();
  artifacts.clear();
  schedules.clear();
  scheduleRuns.length = 0;
}

export function storeReport(doc: Omit<ReportDocument, "id" | "publicId"> & {
  id?: string;
  publicId?: string;
}): ReportDocument {
  const full: ReportDocument = {
    ...doc,
    id: doc.id ?? nextId("rpt"),
    publicId: doc.publicId ?? nextPublicId("RPT"),
  };
  reports.set(full.id, full);
  return full;
}

export function getStoredReport(id: string): ReportDocument | null {
  return reports.get(id) ?? null;
}

export function listStoredReports(): ReportDocument[] {
  return [...reports.values()];
}

export function storeArtifact(reportId: string, artifact: ExportArtifact): void {
  const list = artifacts.get(reportId) ?? [];
  list.push(artifact);
  artifacts.set(reportId, list);
}

export function listArtifacts(reportId?: string): ExportArtifact[] {
  if (reportId) return [...(artifacts.get(reportId) ?? [])];
  return [...artifacts.values()].flat();
}

export function totalStoredBytes(): number {
  return listArtifacts().reduce((sum, a) => sum + a.byteLength, 0);
}

export function createSchedule(
  input: Omit<
    ReportSchedule,
    "id" | "publicId" | "createdAt" | "lastRunAt" | "lastStatus"
  >,
): ReportSchedule {
  const schedule: ReportSchedule = {
    ...input,
    id: nextId("rsch"),
    publicId: nextPublicId("RSCH"),
    lastRunAt: null,
    lastStatus: "idle",
    createdAt: new Date().toISOString(),
  };
  schedules.set(schedule.id, schedule);
  return schedule;
}

export function listSchedules(): ReportSchedule[] {
  return [...schedules.values()];
}

export function updateSchedule(
  id: string,
  patch: Partial<ReportSchedule>,
): ReportSchedule | null {
  const existing = schedules.get(id);
  if (!existing) return null;
  const next = { ...existing, ...patch, id: existing.id };
  schedules.set(id, next);
  return next;
}

export function recordScheduleRun(run: ScheduleRunResult): void {
  scheduleRuns.push(run);
}

export function listScheduleRuns(): ScheduleRunResult[] {
  return [...scheduleRuns];
}

export function allocateReportIds(): { id: string; publicId: string } {
  return { id: nextId("rpt"), publicId: nextPublicId("RPT") };
}
