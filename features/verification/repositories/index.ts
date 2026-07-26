import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  ValidationProfileKey,
  ValidationReportStatus,
  ValidatorName,
  ValidatorResultStatus,
} from "@/constants/work-states";
import type { ValidationProfileDefinition } from "@/constants/validation-profiles";
import type {
  AggregatedValidation,
  EvidenceSnapshotItem,
  ValidationEvidenceSnapshotRecord,
  ValidationReportPackage,
  ValidationReportRecord,
  ValidationResultRecord,
} from "@/features/verification/types";
import { BaseRepository } from "@/repositories/base";

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapReport(row: {
  id: string;
  publicId: string;
  submissionId: string;
  profileKey: string;
  profileId: string | null;
  profileSnapshot: Prisma.JsonValue;
  overallStatus: string;
  overallScore: number;
  warnings: Prisma.JsonValue;
  failures: Prisma.JsonValue;
  passedChecks: number;
  skippedChecks: number;
  durationMs: number;
  generatedAt: Date;
  immutable: boolean;
}): ValidationReportRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    submissionId: row.submissionId,
    profileKey: row.profileKey as ValidationProfileKey,
    profileId: row.profileId,
    profileSnapshot: row.profileSnapshot as unknown as ValidationProfileDefinition,
    overallStatus: row.overallStatus as ValidationReportStatus,
    overallScore: row.overallScore,
    warnings: asStringArray(row.warnings),
    failures: asStringArray(row.failures),
    passedChecks: row.passedChecks,
    skippedChecks: row.skippedChecks,
    durationMs: row.durationMs,
    generatedAt: row.generatedAt.toISOString(),
    immutable: row.immutable,
  };
}

function mapResult(row: {
  id: string;
  reportId: string;
  validatorName: string;
  status: string;
  score: number | null;
  durationMs: number;
  messages: Prisma.JsonValue;
  metadata: Prisma.JsonValue | null;
  sortOrder: number;
  createdAt: Date;
}): ValidationResultRecord {
  return {
    id: row.id,
    reportId: row.reportId,
    validatorName: row.validatorName as ValidatorName,
    status: row.status as ValidatorResultStatus,
    score: row.score,
    durationMs: row.durationMs,
    messages: asStringArray(row.messages),
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapSnapshot(row: {
  id: string;
  reportId: string;
  itemCount: number;
  items: Prisma.JsonValue;
  capturedAt: Date;
}): ValidationEvidenceSnapshotRecord {
  return {
    id: row.id,
    reportId: row.reportId,
    itemCount: row.itemCount,
    items: row.items as EvidenceSnapshotItem[],
    capturedAt: row.capturedAt.toISOString(),
  };
}

class ValidationRepository extends BaseRepository {
  async findProfileIdByKey(key: string): Promise<string | null> {
    const row = await prisma.validationProfile.findUnique({
      where: { key },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findReportByPublicId(
    publicId: string,
  ): Promise<ValidationReportRecord | null> {
    const row = await prisma.validationReport.findUnique({
      where: { publicId },
    });
    return row ? mapReport(row) : null;
  }

  async getReportPackage(
    reportId: string,
  ): Promise<ValidationReportPackage | null> {
    const row = await prisma.validationReport.findUnique({
      where: { id: reportId },
      include: {
        results: { orderBy: { sortOrder: "asc" } },
        evidenceSnapshot: true,
      },
    });
    if (!row || !row.evidenceSnapshot) return null;
    return {
      report: mapReport(row),
      results: row.results.map(mapResult),
      evidenceSnapshot: mapSnapshot(row.evidenceSnapshot),
    };
  }

  async listReportsForSubmission(
    submissionId: string,
  ): Promise<ValidationReportRecord[]> {
    const rows = await prisma.validationReport.findMany({
      where: { submissionId },
      orderBy: { generatedAt: "desc" },
    });
    return rows.map(mapReport);
  }

  async createReport(params: {
    publicId: string;
    submissionId: string;
    profileKey: ValidationProfileKey;
    profileId: string | null;
    profileSnapshot: ValidationProfileDefinition;
    aggregated: AggregatedValidation;
    evidenceItems: EvidenceSnapshotItem[];
  }): Promise<ValidationReportPackage> {
    const created = await prisma.validationReport.create({
      data: {
        publicId: params.publicId,
        submissionId: params.submissionId,
        profileKey: params.profileKey,
        profileId: params.profileId,
        profileSnapshot: params.profileSnapshot as unknown as Prisma.InputJsonValue,
        overallStatus: params.aggregated.overallStatus,
        overallScore: params.aggregated.overallScore,
        warnings: params.aggregated.warnings,
        failures: params.aggregated.failures,
        passedChecks: params.aggregated.passedChecks,
        skippedChecks: params.aggregated.skippedChecks,
        durationMs: params.aggregated.durationMs,
        results: {
          create: params.aggregated.results.map((r, index) => ({
            validatorName: r.validatorName,
            status: r.status,
            score: r.score,
            durationMs: r.durationMs,
            messages: r.messages,
            metadata: (r.metadata ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            sortOrder: index,
          })),
        },
        evidenceSnapshot: {
          create: {
            itemCount: params.evidenceItems.length,
            items: params.evidenceItems as unknown as Prisma.InputJsonValue,
          },
        },
      },
      include: {
        results: { orderBy: { sortOrder: "asc" } },
        evidenceSnapshot: true,
      },
    });

    if (!created.evidenceSnapshot) {
      throw new Error("Evidence snapshot missing after create");
    }

    return {
      report: mapReport(created),
      results: created.results.map(mapResult),
      evidenceSnapshot: mapSnapshot(created.evidenceSnapshot),
    };
  }
}

export const validationRepository = new ValidationRepository();
