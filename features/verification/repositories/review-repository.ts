import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  ReviewDecisionOutcome,
  ReviewFindingCategory,
  ReviewFindingSeverity,
  ReviewLifecycleStatus,
  ReviewMode,
  ReviewPolicyKey,
  ReviewQueueStatus,
} from "@/constants/work-states";
import type { ReviewPolicyDefinition } from "@/constants/review-policies";
import type {
  ReviewAssignmentRecord,
  ReviewDecisionPackage,
  ReviewDecisionRecord,
  ReviewFindingInput,
  ReviewFindingRecord,
  ReviewQueueItemRecord,
} from "@/features/verification/types/review";
import { BaseRepository } from "@/repositories/base";

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapQueueItem(row: {
  id: string;
  submissionId: string;
  validationReportId: string;
  policyKey: string;
  policyId: string | null;
  policySnapshot: Prisma.JsonValue;
  status: string;
  lifecycleStatus: string;
  priority: number;
  assignedReviewerId: string | null;
  claimedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): ReviewQueueItemRecord {
  return {
    id: row.id,
    submissionId: row.submissionId,
    validationReportId: row.validationReportId,
    policyKey: row.policyKey as ReviewPolicyKey,
    policyId: row.policyId,
    policySnapshot: row.policySnapshot as unknown as ReviewPolicyDefinition,
    status: row.status as ReviewQueueStatus,
    lifecycleStatus: row.lifecycleStatus as ReviewLifecycleStatus,
    priority: row.priority,
    assignedReviewerId: row.assignedReviewerId,
    claimedAt: row.claimedAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAssignment(row: {
  id: string;
  queueItemId: string;
  reviewerUserId: string;
  role: string;
  assignedAt: Date;
  releasedAt: Date | null;
  metadata: Prisma.JsonValue | null;
}): ReviewAssignmentRecord {
  return {
    id: row.id,
    queueItemId: row.queueItemId,
    reviewerUserId: row.reviewerUserId,
    role: row.role,
    assignedAt: row.assignedAt.toISOString(),
    releasedAt: row.releasedAt?.toISOString() ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
  };
}

function mapFinding(row: {
  id: string;
  decisionId: string;
  category: string;
  severity: string;
  assignmentStepKey: string | null;
  evidenceItemId: string | null;
  validatorResultId: string | null;
  message: string;
  recommendation: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): ReviewFindingRecord {
  return {
    id: row.id,
    decisionId: row.decisionId,
    category: row.category as ReviewFindingCategory,
    severity: row.severity as ReviewFindingSeverity,
    assignmentStepKey: row.assignmentStepKey,
    evidenceItemId: row.evidenceItemId,
    validatorResultId: row.validatorResultId,
    message: row.message,
    recommendation: row.recommendation,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapDecision(row: {
  id: string;
  publicId: string;
  submissionId: string;
  validationReportId: string;
  queueItemId: string;
  reviewerUserId: string | null;
  reviewMode: string;
  outcome: string;
  confidence: number | null;
  durationMs: number | null;
  decidedAt: Date;
  comments: string | null;
  requestedRevisions: Prisma.JsonValue | null;
  policySnapshot: Prisma.JsonValue;
  metadata: Prisma.JsonValue | null;
  immutable: boolean;
  createdAt: Date;
}): ReviewDecisionRecord {
  let requestedRevisions: ReviewDecisionRecord["requestedRevisions"] = null;
  if (row.requestedRevisions !== null) {
    if (Array.isArray(row.requestedRevisions)) {
      requestedRevisions = asStringArray(row.requestedRevisions);
    } else {
      requestedRevisions = row.requestedRevisions as Record<string, unknown>;
    }
  }

  return {
    id: row.id,
    publicId: row.publicId,
    submissionId: row.submissionId,
    validationReportId: row.validationReportId,
    queueItemId: row.queueItemId,
    reviewerUserId: row.reviewerUserId,
    reviewMode: row.reviewMode as ReviewMode,
    outcome: row.outcome as ReviewDecisionOutcome,
    confidence: row.confidence,
    durationMs: row.durationMs,
    decidedAt: row.decidedAt.toISOString(),
    comments: row.comments,
    requestedRevisions,
    policySnapshot: row.policySnapshot as unknown as ReviewPolicyDefinition,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    immutable: row.immutable,
    createdAt: row.createdAt.toISOString(),
  };
}

class ReviewRepository extends BaseRepository {
  async findPolicyIdByKey(key: string): Promise<string | null> {
    const row = await prisma.reviewPolicy.findUnique({
      where: { key },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findQueueItemById(id: string): Promise<ReviewQueueItemRecord | null> {
    const row = await prisma.reviewQueueItem.findUnique({ where: { id } });
    return row ? mapQueueItem(row) : null;
  }

  async findOpenQueueItemForSubmission(
    submissionId: string,
  ): Promise<ReviewQueueItemRecord | null> {
    const row = await prisma.reviewQueueItem.findFirst({
      where: {
        submissionId,
        status: { in: ["pending", "assigned", "in_review", "escalated", "deferred"] },
      },
      orderBy: { createdAt: "desc" },
    });
    return row ? mapQueueItem(row) : null;
  }

  async listQueue(params: {
    status?: ReviewQueueStatus;
    reviewerUserId?: string;
    limit?: number;
  }): Promise<ReviewQueueItemRecord[]> {
    const rows = await prisma.reviewQueueItem.findMany({
      where: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.reviewerUserId
          ? { assignedReviewerId: params.reviewerUserId }
          : {}),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: params.limit ?? 50,
    });
    return rows.map(mapQueueItem);
  }

  async createQueueItem(params: {
    submissionId: string;
    validationReportId: string;
    policyKey: ReviewPolicyKey;
    policyId: string | null;
    policySnapshot: ReviewPolicyDefinition;
    status: ReviewQueueStatus;
    lifecycleStatus: ReviewLifecycleStatus;
    priority?: number;
    metadata?: Record<string, unknown> | null;
  }): Promise<ReviewQueueItemRecord> {
    const row = await prisma.reviewQueueItem.create({
      data: {
        submissionId: params.submissionId,
        validationReportId: params.validationReportId,
        policyKey: params.policyKey,
        policyId: params.policyId,
        policySnapshot: params.policySnapshot as unknown as Prisma.InputJsonValue,
        status: params.status,
        lifecycleStatus: params.lifecycleStatus,
        priority: params.priority ?? 0,
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return mapQueueItem(row);
  }

  async updateQueueItem(params: {
    id: string;
    status?: ReviewQueueStatus;
    lifecycleStatus?: ReviewLifecycleStatus;
    assignedReviewerId?: string | null;
    claimedAt?: Date | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<ReviewQueueItemRecord> {
    const row = await prisma.reviewQueueItem.update({
      where: { id: params.id },
      data: {
        ...(params.status !== undefined ? { status: params.status } : {}),
        ...(params.lifecycleStatus !== undefined
          ? { lifecycleStatus: params.lifecycleStatus }
          : {}),
        ...(params.assignedReviewerId !== undefined
          ? { assignedReviewerId: params.assignedReviewerId }
          : {}),
        ...(params.claimedAt !== undefined ? { claimedAt: params.claimedAt } : {}),
        ...(params.startedAt !== undefined ? { startedAt: params.startedAt } : {}),
        ...(params.completedAt !== undefined
          ? { completedAt: params.completedAt }
          : {}),
        ...(params.metadata !== undefined
          ? {
              metadata: params.metadata as Prisma.InputJsonValue | undefined,
            }
          : {}),
      },
    });
    return mapQueueItem(row);
  }

  async createReviewAssignment(params: {
    queueItemId: string;
    reviewerUserId: string;
    role?: string;
  }): Promise<ReviewAssignmentRecord> {
    const row = await prisma.reviewAssignment.create({
      data: {
        queueItemId: params.queueItemId,
        reviewerUserId: params.reviewerUserId,
        role: params.role ?? "primary",
      },
    });
    return mapAssignment(row);
  }

  async createDecision(params: {
    publicId: string;
    submissionId: string;
    validationReportId: string;
    queueItemId: string;
    reviewerUserId: string | null;
    reviewMode: ReviewMode;
    outcome: ReviewDecisionOutcome;
    confidence: number | null;
    durationMs: number | null;
    comments: string | null;
    requestedRevisions: Record<string, unknown> | string[] | null;
    policySnapshot: ReviewPolicyDefinition;
    metadata: Record<string, unknown> | null;
    findings: ReviewFindingInput[];
  }): Promise<ReviewDecisionPackage> {
    const created = await prisma.reviewDecision.create({
      data: {
        publicId: params.publicId,
        submissionId: params.submissionId,
        validationReportId: params.validationReportId,
        queueItemId: params.queueItemId,
        reviewerUserId: params.reviewerUserId,
        reviewMode: params.reviewMode,
        outcome: params.outcome,
        confidence: params.confidence,
        durationMs: params.durationMs,
        comments: params.comments,
        requestedRevisions: (params.requestedRevisions ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        policySnapshot: params.policySnapshot as unknown as Prisma.InputJsonValue,
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        findings: {
          create: params.findings.map((f) => ({
            category: f.category,
            severity: f.severity,
            assignmentStepKey: f.assignmentStepKey ?? null,
            evidenceItemId: f.evidenceItemId ?? null,
            validatorResultId: f.validatorResultId ?? null,
            message: f.message,
            recommendation: f.recommendation ?? null,
            metadata: (f.metadata ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          })),
        },
      },
      include: { findings: true },
    });

    return {
      decision: mapDecision(created),
      findings: created.findings.map(mapFinding),
    };
  }

  async findDecisionByPublicId(
    publicId: string,
  ): Promise<ReviewDecisionPackage | null> {
    const row = await prisma.reviewDecision.findUnique({
      where: { publicId },
      include: { findings: true },
    });
    if (!row) return null;
    return {
      decision: mapDecision(row),
      findings: row.findings.map(mapFinding),
    };
  }

  async listDecisionsForSubmission(
    submissionId: string,
  ): Promise<ReviewDecisionRecord[]> {
    const rows = await prisma.reviewDecision.findMany({
      where: { submissionId },
      orderBy: { decidedAt: "desc" },
    });
    return rows.map(mapDecision);
  }

  async listFindingsForSubmission(
    submissionId: string,
  ): Promise<ReviewFindingRecord[]> {
    const rows = await prisma.reviewFinding.findMany({
      where: { decision: { submissionId } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapFinding);
  }
}

export const reviewRepository = new ReviewRepository();
