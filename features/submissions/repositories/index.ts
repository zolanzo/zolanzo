import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  ManifestEvidenceKind,
  SubmissionStatus,
} from "@/constants/work-states";
import type { EvidenceReference } from "@/lib/integrations/types";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";
import type {
  EvidenceItemRecord,
  EvidenceManifestRecord,
  SubmissionPackage,
  SubmissionRecord,
  SubmissionSummaryRecord,
} from "@/features/submissions/types";
import type { GeneratedSummary } from "@/features/submissions/services/summary-engine";
import { BaseRepository } from "@/repositories/base";

function mapSubmission(row: {
  id: string;
  publicId: string;
  assignmentId: string;
  workerUserId: string;
  status: string;
  executionContextSnapshot: Prisma.JsonValue;
  deviceSnapshot: Prisma.JsonValue | null;
  gpsSnapshot: Prisma.JsonValue | null;
  timingMetrics: Prisma.JsonValue | null;
  readyAt: Date | null;
  submittedAt: Date | null;
  finalizedAt: Date | null;
  closedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): SubmissionRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    assignmentId: row.assignmentId,
    workerUserId: row.workerUserId,
    status: row.status as SubmissionStatus,
    executionContextSnapshot:
      row.executionContextSnapshot as ExecutionContext,
    deviceSnapshot:
      (row.deviceSnapshot as Record<string, unknown> | null) ?? null,
    gpsSnapshot: (row.gpsSnapshot as Record<string, unknown> | null) ?? null,
    timingMetrics:
      (row.timingMetrics as Record<string, unknown> | null) ?? null,
    readyAt: row.readyAt?.toISOString() ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    finalizedAt: row.finalizedAt?.toISOString() ?? null,
    closedAt: row.closedAt?.toISOString() ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapManifest(row: {
  id: string;
  submissionId: string;
  version: number;
  finalized: boolean;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): EvidenceManifestRecord {
  return {
    id: row.id,
    submissionId: row.submissionId,
    version: row.version,
    finalized: row.finalized,
    finalizedAt: row.finalizedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapItem(row: {
  id: string;
  manifestId: string;
  kind: string;
  label: string;
  stepKey: string | null;
  reference: Prisma.JsonValue;
  contentHash: string | null;
  sizeBytes: number | null;
  inlinePayload: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  replacedAt: Date | null;
}): EvidenceItemRecord {
  return {
    id: row.id,
    manifestId: row.manifestId,
    kind: row.kind as ManifestEvidenceKind,
    label: row.label,
    stepKey: row.stepKey,
    reference: row.reference as EvidenceReference,
    contentHash: row.contentHash,
    sizeBytes: row.sizeBytes,
    inlinePayload:
      (row.inlinePayload as Record<string, unknown> | string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    replacedAt: row.replacedAt?.toISOString() ?? null,
  };
}

function mapSummary(row: {
  id: string;
  submissionId: string;
  timeSpentSeconds: number | null;
  completedSteps: number;
  requiredSteps: number;
  requiredCompleted: number;
  evidenceCounts: Prisma.JsonValue;
  executionMetrics: Prisma.JsonValue;
  workerNotesSummary: string | null;
  generatedAt: Date;
}): SubmissionSummaryRecord {
  return {
    id: row.id,
    submissionId: row.submissionId,
    timeSpentSeconds: row.timeSpentSeconds,
    completedSteps: row.completedSteps,
    requiredSteps: row.requiredSteps,
    requiredCompleted: row.requiredCompleted,
    evidenceCounts: row.evidenceCounts as Record<string, number>,
    executionMetrics: row.executionMetrics as Record<string, unknown>,
    workerNotesSummary: row.workerNotesSummary,
    generatedAt: row.generatedAt.toISOString(),
  };
}

export class SubmissionRepository extends BaseRepository {
  async createDraft(params: {
    publicId: string;
    assignmentId: string;
    workerUserId: string;
    executionContextSnapshot: ExecutionContext;
    deviceSnapshot?: Record<string, unknown> | null;
    gpsSnapshot?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<SubmissionPackage> {
    const created = await prisma.$transaction(async (tx) => {
      const submission = await tx.submission.create({
        data: {
          publicId: params.publicId,
          assignmentId: params.assignmentId,
          workerUserId: params.workerUserId,
          status: "draft",
          executionContextSnapshot:
            params.executionContextSnapshot as unknown as Prisma.InputJsonValue,
          deviceSnapshot: (params.deviceSnapshot ??
            undefined) as Prisma.InputJsonValue | undefined,
          gpsSnapshot: (params.gpsSnapshot ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          metadata: (params.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });
      const manifest = await tx.evidenceManifest.create({
        data: { submissionId: submission.id, version: 1, finalized: false },
      });
      return { submission, manifest };
    });

    return {
      submission: mapSubmission(created.submission),
      manifest: mapManifest(created.manifest),
      items: [],
      summary: null,
    };
  }

  async findByPublicId(publicId: string): Promise<SubmissionRecord | null> {
    const row = await prisma.submission.findUnique({ where: { publicId } });
    return row ? mapSubmission(row) : null;
  }

  async findById(id: string): Promise<SubmissionRecord | null> {
    const row = await prisma.submission.findUnique({ where: { id } });
    return row ? mapSubmission(row) : null;
  }

  async findOpenDraftForAssignment(
    assignmentId: string,
  ): Promise<SubmissionRecord | null> {
    const row = await prisma.submission.findFirst({
      where: {
        assignmentId,
        status: { in: ["draft", "ready"] },
      },
      orderBy: { createdAt: "desc" },
    });
    return row ? mapSubmission(row) : null;
  }

  async getPackage(submissionId: string): Promise<SubmissionPackage | null> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        manifest: { include: { items: { orderBy: { createdAt: "asc" } } } },
        summary: true,
      },
    });
    if (!submission || !submission.manifest) return null;
    return {
      submission: mapSubmission(submission),
      manifest: mapManifest(submission.manifest),
      items: submission.manifest.items.map(mapItem),
      summary: submission.summary ? mapSummary(submission.summary) : null,
    };
  }

  async getManifestBySubmissionId(
    submissionId: string,
  ): Promise<EvidenceManifestRecord | null> {
    const row = await prisma.evidenceManifest.findUnique({
      where: { submissionId },
    });
    return row ? mapManifest(row) : null;
  }

  async createEvidenceItem(params: {
    manifestId: string;
    kind: ManifestEvidenceKind;
    label: string;
    stepKey?: string | null;
    reference: EvidenceReference;
    contentHash?: string | null;
    sizeBytes?: number | null;
    inlinePayload?: Record<string, unknown> | string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<EvidenceItemRecord> {
    const row = await prisma.evidenceItem.create({
      data: {
        manifestId: params.manifestId,
        kind: params.kind,
        label: params.label,
        stepKey: params.stepKey ?? null,
        reference: params.reference as unknown as Prisma.InputJsonValue,
        contentHash: params.contentHash ?? null,
        sizeBytes: params.sizeBytes ?? null,
        inlinePayload: (params.inlinePayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return mapItem(row);
  }

  async findEvidenceItem(id: string): Promise<EvidenceItemRecord | null> {
    const row = await prisma.evidenceItem.findUnique({ where: { id } });
    return row ? mapItem(row) : null;
  }

  async updateEvidenceItem(params: {
    id: string;
    kind: ManifestEvidenceKind;
    label: string;
    stepKey?: string | null;
    reference: EvidenceReference;
    contentHash?: string | null;
    sizeBytes?: number | null;
    inlinePayload?: Record<string, unknown> | string | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<EvidenceItemRecord> {
    const row = await prisma.evidenceItem.update({
      where: { id: params.id },
      data: {
        kind: params.kind,
        label: params.label,
        stepKey: params.stepKey ?? null,
        reference: params.reference as unknown as Prisma.InputJsonValue,
        contentHash: params.contentHash ?? null,
        sizeBytes: params.sizeBytes ?? null,
        inlinePayload: (params.inlinePayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        replacedAt: new Date(),
      },
    });
    return mapItem(row);
  }

  async deleteEvidenceItem(id: string): Promise<void> {
    await prisma.evidenceItem.delete({ where: { id } });
  }

  async setStatus(params: {
    id: string;
    status: SubmissionStatus;
    readyAt?: Date | null;
    submittedAt?: Date | null;
    finalizedAt?: Date | null;
    closedAt?: Date | null;
    timingMetrics?: Record<string, unknown> | null;
  }): Promise<SubmissionRecord> {
    const row = await prisma.submission.update({
      where: { id: params.id },
      data: {
        status: params.status,
        ...(params.readyAt !== undefined ? { readyAt: params.readyAt } : {}),
        ...(params.submittedAt !== undefined
          ? { submittedAt: params.submittedAt }
          : {}),
        ...(params.finalizedAt !== undefined
          ? { finalizedAt: params.finalizedAt }
          : {}),
        ...(params.closedAt !== undefined ? { closedAt: params.closedAt } : {}),
        ...(params.timingMetrics !== undefined
          ? {
              timingMetrics: params.timingMetrics as
                | Prisma.InputJsonValue
                | undefined,
            }
          : {}),
      },
    });
    return mapSubmission(row);
  }

  async finalizeManifest(manifestId: string): Promise<EvidenceManifestRecord> {
    const row = await prisma.evidenceManifest.update({
      where: { id: manifestId },
      data: { finalized: true, finalizedAt: new Date() },
    });
    return mapManifest(row);
  }

  async upsertSummary(params: {
    submissionId: string;
    summary: GeneratedSummary;
  }): Promise<SubmissionSummaryRecord> {
    const row = await prisma.submissionSummary.upsert({
      where: { submissionId: params.submissionId },
      create: {
        submissionId: params.submissionId,
        timeSpentSeconds: params.summary.timeSpentSeconds,
        completedSteps: params.summary.completedSteps,
        requiredSteps: params.summary.requiredSteps,
        requiredCompleted: params.summary.requiredCompleted,
        evidenceCounts: params.summary.evidenceCounts as Prisma.InputJsonValue,
        executionMetrics: params.summary
          .executionMetrics as Prisma.InputJsonValue,
        workerNotesSummary: params.summary.workerNotesSummary,
      },
      update: {
        timeSpentSeconds: params.summary.timeSpentSeconds,
        completedSteps: params.summary.completedSteps,
        requiredSteps: params.summary.requiredSteps,
        requiredCompleted: params.summary.requiredCompleted,
        evidenceCounts: params.summary.evidenceCounts as Prisma.InputJsonValue,
        executionMetrics: params.summary
          .executionMetrics as Prisma.InputJsonValue,
        workerNotesSummary: params.summary.workerNotesSummary,
        generatedAt: new Date(),
      },
    });
    return mapSummary(row);
  }
}

export const submissionRepository = new SubmissionRepository();
