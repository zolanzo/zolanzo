import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { TaskInstanceStatus } from "@/constants/work-states";
import type {
  InventoryCounts,
  TaskInstancePriority,
  TaskInstanceRecord,
} from "@/features/tasks/types";
import type { GenerationStrategy } from "@/constants/generation-strategies";
import type {
  GenerationPolicy,
  GenerationPolicyConfig,
} from "@/constants/generation-policies";
import { BaseRepository } from "@/repositories/base";
import { emptyInventoryCounts } from "@/features/tasks/services/inventory";

function mapRow(row: {
  id: string;
  publicId: string;
  campaignId: string;
  taskTemplateId: string;
  taskTemplateVersion: number;
  sequenceNumber: number;
  generationStrategy: string;
  generationPolicy: string;
  generationPolicyConfig: Prisma.JsonValue | null;
  status: string;
  priority: string;
  reserved: boolean;
  reservedAt: Date | null;
  expiresAt: Date | null;
  campaignPublicId: string;
  templatePublicId: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}): TaskInstanceRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    campaignId: row.campaignId,
    taskTemplateId: row.taskTemplateId,
    taskTemplateVersion: row.taskTemplateVersion,
    sequenceNumber: row.sequenceNumber,
    generationStrategy: row.generationStrategy as GenerationStrategy,
    generationPolicy: row.generationPolicy as GenerationPolicy,
    generationPolicyConfig:
      (row.generationPolicyConfig as GenerationPolicyConfig | null) ?? null,
    status: row.status as TaskInstanceStatus,
    priority: row.priority as TaskInstancePriority,
    reserved: row.reserved,
    reservedAt: row.reservedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    campaignPublicId: row.campaignPublicId,
    templatePublicId: row.templatePublicId,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    archivedAt: row.archivedAt?.toISOString() ?? null,
  };
}

export type TaskInstanceCreateRow = {
  publicId: string;
  campaignId: string;
  taskTemplateId: string;
  taskTemplateVersion: number;
  sequenceNumber: number;
  generationStrategy: GenerationStrategy;
  generationPolicy: GenerationPolicy;
  generationPolicyConfig: GenerationPolicyConfig | null;
  status: TaskInstanceStatus;
  priority: TaskInstancePriority;
  reserved: boolean;
  expiresAt: Date | null;
  campaignPublicId: string;
  templatePublicId: string;
  metadata?: Record<string, unknown> | null;
};

export class TaskInstanceRepository extends BaseRepository {
  async createMany(rows: TaskInstanceCreateRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    const result = await prisma.taskInstance.createMany({
      data: rows.map((row) => ({
        publicId: row.publicId,
        campaignId: row.campaignId,
        taskTemplateId: row.taskTemplateId,
        taskTemplateVersion: row.taskTemplateVersion,
        sequenceNumber: row.sequenceNumber,
        generationStrategy: row.generationStrategy,
        generationPolicy: row.generationPolicy,
        generationPolicyConfig: (row.generationPolicyConfig ??
          undefined) as Prisma.InputJsonValue | undefined,
        status: row.status,
        priority: row.priority,
        reserved: row.reserved,
        expiresAt: row.expiresAt,
        campaignPublicId: row.campaignPublicId,
        templatePublicId: row.templatePublicId,
        metadata: (row.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      })),
    });
    return result.count;
  }

  async findById(id: string): Promise<TaskInstanceRecord | null> {
    const row = await prisma.taskInstance.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findByPublicId(publicId: string): Promise<TaskInstanceRecord | null> {
    const row = await prisma.taskInstance.findUnique({ where: { publicId } });
    return row ? mapRow(row) : null;
  }

  async listByCampaign(
    campaignId: string,
    status?: TaskInstanceStatus,
  ): Promise<TaskInstanceRecord[]> {
    const rows = await prisma.taskInstance.findMany({
      where: { campaignId, status },
      orderBy: { sequenceNumber: "asc" },
    });
    return rows.map(mapRow);
  }

  async maxSequence(campaignId: string): Promise<number> {
    const row = await prisma.taskInstance.findFirst({
      where: { campaignId },
      orderBy: { sequenceNumber: "desc" },
      select: { sequenceNumber: true },
    });
    return row?.sequenceNumber ?? 0;
  }

  async countByStatus(campaignId: string): Promise<InventoryCounts> {
    const groups = await prisma.taskInstance.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: { _all: true },
    });
    const counts = emptyInventoryCounts();
    for (const g of groups) {
      const status = g.status as keyof InventoryCounts;
      if (status in counts) {
        counts[status] = g._count._all;
      }
    }
    return counts;
  }

  async setStatus(params: {
    id: string;
    status: TaskInstanceStatus;
    reserved?: boolean;
    reservedAt?: Date | null;
    archivedAt?: Date | null;
  }): Promise<TaskInstanceRecord> {
    const row = await prisma.taskInstance.update({
      where: { id: params.id },
      data: {
        status: params.status,
        ...(params.reserved !== undefined ? { reserved: params.reserved } : {}),
        ...(params.reservedAt !== undefined
          ? { reservedAt: params.reservedAt }
          : {}),
        ...(params.archivedAt !== undefined
          ? { archivedAt: params.archivedAt }
          : {}),
      },
    });
    return mapRow(row);
  }
}

export const taskInstanceRepository = new TaskInstanceRepository();
