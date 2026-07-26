import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  AssignmentStatus,
  AssignmentStepStatus,
  AssignmentTimelineEventType,
} from "@/constants/work-states";
import type { ExecutionContext } from "@/features/assignments/types/execution-context";
import type {
  AssignmentNoteRecord,
  AssignmentPriority,
  AssignmentRecord,
  AssignmentStepRecord,
  AssignmentTimelineRecord,
  ExecutionStepRecord,
  ReservationRecord,
} from "@/features/assignments/types";
import type { ExecutionStepDefinition } from "@/features/assignments/services/execution-engine";
import { BaseRepository } from "@/repositories/base";

function mapAssignment(row: {
  id: string;
  publicId: string;
  taskInstanceId: string;
  campaignId: string;
  workerUserId: string;
  taskTemplateId: string;
  taskTemplateVersion: number;
  reservationId: string;
  status: string;
  priority: string;
  attempts: number;
  maxAttempts: number;
  executionContext: Prisma.JsonValue | null;
  progressPercent: number;
  estimatedRemainingMin: number | null;
  lastActivityAt: Date | null;
  pausedAt: Date | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): AssignmentRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    taskInstanceId: row.taskInstanceId,
    campaignId: row.campaignId,
    workerUserId: row.workerUserId,
    taskTemplateId: row.taskTemplateId,
    taskTemplateVersion: row.taskTemplateVersion,
    reservationId: row.reservationId,
    status: row.status as AssignmentStatus,
    priority: row.priority as AssignmentPriority,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    executionContext: (row.executionContext as ExecutionContext | null) ?? null,
    progressPercent: row.progressPercent,
    estimatedRemainingMin: row.estimatedRemainingMin,
    lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
    pausedAt: row.pausedAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapReservation(row: {
  id: string;
  taskInstanceId: string;
  workerUserId: string;
  campaignId: string;
  status: string;
  timeoutSeconds: number;
  expiresAt: Date;
  confirmedAt: Date | null;
  releasedAt: Date | null;
  expiredAt: Date | null;
  convertedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): ReservationRecord {
  return {
    id: row.id,
    taskInstanceId: row.taskInstanceId,
    workerUserId: row.workerUserId,
    campaignId: row.campaignId,
    status: row.status as ReservationRecord["status"],
    timeoutSeconds: row.timeoutSeconds,
    expiresAt: row.expiresAt.toISOString(),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    expiredAt: row.expiredAt?.toISOString() ?? null,
    convertedAt: row.convertedAt?.toISOString() ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapExecutionStep(row: {
  id: string;
  assignmentId: string;
  sequence: number;
  stepKey: string;
  capability: string;
  instruction: string;
  required: boolean;
  conditionalKey: string | null;
  dependsOnStepKeys: Prisma.JsonValue;
  estimatedDurationMin: number | null;
  config: Prisma.JsonValue | null;
  createdAt: Date;
}): ExecutionStepRecord {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    sequence: row.sequence,
    stepKey: row.stepKey,
    capability: row.capability,
    instruction: row.instruction,
    required: row.required,
    conditionalKey: row.conditionalKey,
    dependsOnStepKeys: row.dependsOnStepKeys as string[],
    estimatedDurationMin: row.estimatedDurationMin,
    config: (row.config as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapAssignmentStep(row: {
  id: string;
  assignmentId: string;
  executionStepId: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
  skipReason: string | null;
  failReason: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  executionStep?: Parameters<typeof mapExecutionStep>[0];
}): AssignmentStepRecord {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    executionStepId: row.executionStepId,
    status: row.status as AssignmentStepStatus,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    skipReason: row.skipReason,
    failReason: row.failReason,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    executionStep: row.executionStep
      ? mapExecutionStep(row.executionStep)
      : undefined,
  };
}

function mapTimeline(row: {
  id: string;
  assignmentId: string;
  eventType: string;
  payload: Prisma.JsonValue | null;
  actorUserId: string | null;
  createdAt: Date;
}): AssignmentTimelineRecord {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    eventType: row.eventType as AssignmentTimelineEventType,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    actorUserId: row.actorUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapNote(row: {
  id: string;
  assignmentId: string;
  authorUserId: string;
  visibility: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}): AssignmentNoteRecord {
  return {
    id: row.id,
    assignmentId: row.assignmentId,
    authorUserId: row.authorUserId,
    visibility: row.visibility as AssignmentNoteRecord["visibility"],
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const ACTIVE_ASSIGNMENT_STATUSES = [
  "reserved",
  "assigned",
  "claimed",
  "started",
  "paused",
  "in_progress",
  "ready_for_submission",
  "submitted",
  "under_validation",
  "under_review",
  "revision_requested",
  "escalated",
] as const;

export class AssignmentRepository extends BaseRepository {
  async create(params: {
    publicId: string;
    taskInstanceId: string;
    campaignId: string;
    workerUserId: string;
    taskTemplateId: string;
    taskTemplateVersion: number;
    reservationId: string;
    priority: AssignmentPriority;
    executionContext?: ExecutionContext | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<AssignmentRecord> {
    const row = await prisma.assignment.create({
      data: {
        publicId: params.publicId,
        taskInstanceId: params.taskInstanceId,
        campaignId: params.campaignId,
        workerUserId: params.workerUserId,
        taskTemplateId: params.taskTemplateId,
        taskTemplateVersion: params.taskTemplateVersion,
        reservationId: params.reservationId,
        status: "assigned",
        priority: params.priority,
        executionContext: (params.executionContext ??
          undefined) as Prisma.InputJsonValue | undefined,
        lastActivityAt: new Date(),
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return mapAssignment(row);
  }

  async hydrateExecutionPlan(params: {
    assignmentId: string;
    plan: readonly ExecutionStepDefinition[];
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const step of params.plan) {
        const execution = await tx.executionStep.create({
          data: {
            assignmentId: params.assignmentId,
            sequence: step.sequence,
            stepKey: step.stepKey,
            capability: step.capability,
            instruction: step.instruction,
            required: step.required,
            conditionalKey: step.conditionalKey,
            dependsOnStepKeys: step.dependsOnStepKeys as Prisma.InputJsonValue,
            estimatedDurationMin: step.estimatedDurationMin,
            config: (step.config ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        });
        await tx.assignmentStep.create({
          data: {
            assignmentId: params.assignmentId,
            executionStepId: execution.id,
            status: "pending",
          },
        });
      }
    });
  }

  async addTimelineEvent(params: {
    assignmentId: string;
    eventType: AssignmentTimelineEventType;
    actorUserId?: string | null;
    payload?: Record<string, unknown> | null;
  }): Promise<AssignmentTimelineRecord> {
    const row = await prisma.assignmentTimelineEvent.create({
      data: {
        assignmentId: params.assignmentId,
        eventType: params.eventType,
        actorUserId: params.actorUserId ?? null,
        payload: (params.payload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return mapTimeline(row);
  }

  async findById(id: string): Promise<AssignmentRecord | null> {
    const row = await prisma.assignment.findUnique({ where: { id } });
    return row ? mapAssignment(row) : null;
  }

  async findByPublicId(publicId: string): Promise<AssignmentRecord | null> {
    const row = await prisma.assignment.findUnique({ where: { publicId } });
    return row ? mapAssignment(row) : null;
  }

  async findByTaskInstanceId(
    taskInstanceId: string,
  ): Promise<AssignmentRecord | null> {
    const row = await prisma.assignment.findUnique({
      where: { taskInstanceId },
    });
    return row ? mapAssignment(row) : null;
  }

  async updateStatus(params: {
    id: string;
    status: AssignmentStatus;
    startedAt?: Date | null;
    pausedAt?: Date | null;
    submittedAt?: Date | null;
    completedAt?: Date | null;
    progressPercent?: number;
    estimatedRemainingMin?: number | null;
  }): Promise<AssignmentRecord> {
    const row = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        status: params.status,
        lastActivityAt: new Date(),
        ...(params.startedAt !== undefined ? { startedAt: params.startedAt } : {}),
        ...(params.pausedAt !== undefined ? { pausedAt: params.pausedAt } : {}),
        ...(params.submittedAt !== undefined
          ? { submittedAt: params.submittedAt }
          : {}),
        ...(params.completedAt !== undefined
          ? { completedAt: params.completedAt }
          : {}),
        ...(params.progressPercent !== undefined
          ? { progressPercent: params.progressPercent }
          : {}),
        ...(params.estimatedRemainingMin !== undefined
          ? { estimatedRemainingMin: params.estimatedRemainingMin }
          : {}),
      },
    });
    return mapAssignment(row);
  }

  async updateProgress(params: {
    id: string;
    progressPercent: number;
    estimatedRemainingMin: number | null;
  }): Promise<void> {
    await prisma.assignment.update({
      where: { id: params.id },
      data: {
        progressPercent: params.progressPercent,
        estimatedRemainingMin: params.estimatedRemainingMin,
        lastActivityAt: new Date(),
      },
    });
  }

  async listExecutionSteps(
    assignmentId: string,
  ): Promise<ExecutionStepRecord[]> {
    const rows = await prisma.executionStep.findMany({
      where: { assignmentId },
      orderBy: { sequence: "asc" },
    });
    return rows.map(mapExecutionStep);
  }

  async listChecklist(assignmentId: string): Promise<AssignmentStepRecord[]> {
    const rows = await prisma.assignmentStep.findMany({
      where: { assignmentId },
      include: { executionStep: true },
      orderBy: { executionStep: { sequence: "asc" } },
    });
    return rows.map(mapAssignmentStep);
  }

  async findChecklistStep(
    assignmentStepId: string,
  ): Promise<AssignmentStepRecord | null> {
    const row = await prisma.assignmentStep.findUnique({
      where: { id: assignmentStepId },
      include: { executionStep: true },
    });
    return row ? mapAssignmentStep(row) : null;
  }

  async updateChecklistStep(params: {
    id: string;
    status: AssignmentStepStatus;
    startedAt?: Date | null;
    completedAt?: Date | null;
    failedAt?: Date | null;
    skipReason?: string | null;
    failReason?: string | null;
  }): Promise<AssignmentStepRecord> {
    const row = await prisma.assignmentStep.update({
      where: { id: params.id },
      data: {
        status: params.status,
        ...(params.startedAt !== undefined ? { startedAt: params.startedAt } : {}),
        ...(params.completedAt !== undefined
          ? { completedAt: params.completedAt }
          : {}),
        ...(params.failedAt !== undefined ? { failedAt: params.failedAt } : {}),
        ...(params.skipReason !== undefined
          ? { skipReason: params.skipReason }
          : {}),
        ...(params.failReason !== undefined
          ? { failReason: params.failReason }
          : {}),
      },
      include: { executionStep: true },
    });
    return mapAssignmentStep(row);
  }

  async listTimeline(
    assignmentId: string,
  ): Promise<AssignmentTimelineRecord[]> {
    const rows = await prisma.assignmentTimelineEvent.findMany({
      where: { assignmentId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapTimeline);
  }

  async createNote(params: {
    assignmentId: string;
    authorUserId: string;
    body: string;
    visibility?: "worker_private" | "reviewer_placeholder";
  }): Promise<AssignmentNoteRecord> {
    const row = await prisma.assignmentNote.create({
      data: {
        assignmentId: params.assignmentId,
        authorUserId: params.authorUserId,
        body: params.body,
        visibility: params.visibility ?? "worker_private",
      },
    });
    return mapNote(row);
  }

  async listNotes(assignmentId: string): Promise<AssignmentNoteRecord[]> {
    const rows = await prisma.assignmentNote.findMany({
      where: { assignmentId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapNote);
  }

  async countActiveForWorker(workerUserId: string): Promise<number> {
    return prisma.assignment.count({
      where: {
        workerUserId,
        status: { in: [...ACTIVE_ASSIGNMENT_STATUSES] },
      },
    });
  }

  async countActiveForWorkerCampaign(
    workerUserId: string,
    campaignId: string,
  ): Promise<number> {
    return prisma.assignment.count({
      where: {
        workerUserId,
        campaignId,
        status: { in: [...ACTIVE_ASSIGNMENT_STATUSES] },
      },
    });
  }

  async lastCompletedAt(workerUserId: string): Promise<string | null> {
    const row = await prisma.assignment.findFirst({
      where: { workerUserId, status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });
    return row?.completedAt?.toISOString() ?? null;
  }
}

export class ReservationRepository extends BaseRepository {
  async create(params: {
    taskInstanceId: string;
    workerUserId: string;
    campaignId: string;
    timeoutSeconds: number;
    expiresAt: Date;
    metadata?: Record<string, unknown> | null;
  }): Promise<ReservationRecord> {
    const row = await prisma.reservation.create({
      data: {
        taskInstanceId: params.taskInstanceId,
        workerUserId: params.workerUserId,
        campaignId: params.campaignId,
        status: "pending",
        timeoutSeconds: params.timeoutSeconds,
        expiresAt: params.expiresAt,
        metadata: (params.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return mapReservation(row);
  }

  async findById(id: string): Promise<ReservationRecord | null> {
    const row = await prisma.reservation.findUnique({ where: { id } });
    return row ? mapReservation(row) : null;
  }

  async markConverted(id: string): Promise<ReservationRecord> {
    const row = await prisma.reservation.update({
      where: { id },
      data: {
        status: "converted",
        confirmedAt: new Date(),
        convertedAt: new Date(),
      },
    });
    return mapReservation(row);
  }

  async markExpired(id: string): Promise<ReservationRecord> {
    const row = await prisma.reservation.update({
      where: { id },
      data: { status: "expired", expiredAt: new Date() },
    });
    return mapReservation(row);
  }

  async markReleased(id: string): Promise<ReservationRecord> {
    const row = await prisma.reservation.update({
      where: { id },
      data: { status: "released", releasedAt: new Date() },
    });
    return mapReservation(row);
  }

  async listExpiredPending(now = new Date()): Promise<ReservationRecord[]> {
    const rows = await prisma.reservation.findMany({
      where: { status: "pending", expiresAt: { lte: now } },
      take: 500,
    });
    return rows.map(mapReservation);
  }

  async analyticsCounts(): Promise<{
    total: number;
    expired: number;
    converted: number;
    pending: number;
  }> {
    const [total, expired, converted, pending] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: "expired" } }),
      prisma.reservation.count({ where: { status: "converted" } }),
      prisma.reservation.count({ where: { status: "pending" } }),
    ]);
    return { total, expired, converted, pending };
  }
}

export const assignmentRepository = new AssignmentRepository();
export const reservationRepository = new ReservationRepository();
