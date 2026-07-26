import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  TaskTemplatePayload,
  TaskTemplateRecord,
} from "@/features/task-templates/types";
import { BaseRepository } from "@/repositories/base";

function mapRow(row: {
  id: string;
  publicId: string;
  templateKey: string;
  version: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory: string | null;
  difficulty: string;
  estimatedDurationMin: number | null;
  capabilitySet: Prisma.JsonValue;
  requiredEvidence: Prisma.JsonValue;
  submissionSchema: Prisma.JsonValue;
  validationRules: Prisma.JsonValue;
  reviewRules: Prisma.JsonValue;
  rewardStrategy: Prisma.JsonValue;
  constraints: Prisma.JsonValue;
  supportedPlatforms: Prisma.JsonValue;
  supportedDevices: Prisma.JsonValue;
  supportedCountries: Prisma.JsonValue;
  supportedLanguages: Prisma.JsonValue;
  requiredSkills: Prisma.JsonValue;
  visibility: string;
  status: string;
  metadata: Prisma.JsonValue | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  previousVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TaskTemplateRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    templateKey: row.templateKey,
    version: row.version,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    difficulty: row.difficulty as TaskTemplateRecord["difficulty"],
    estimatedDurationMin: row.estimatedDurationMin,
    capabilitySet: row.capabilitySet as TaskTemplateRecord["capabilitySet"],
    requiredEvidence:
      row.requiredEvidence as TaskTemplateRecord["requiredEvidence"],
    submissionSchema:
      row.submissionSchema as TaskTemplateRecord["submissionSchema"],
    validationRules:
      row.validationRules as TaskTemplateRecord["validationRules"],
    reviewRules: row.reviewRules as TaskTemplateRecord["reviewRules"],
    rewardStrategy: row.rewardStrategy as TaskTemplateRecord["rewardStrategy"],
    constraints: row.constraints as TaskTemplateRecord["constraints"],
    supportedPlatforms: row.supportedPlatforms as string[],
    supportedDevices: row.supportedDevices as string[],
    supportedCountries: row.supportedCountries as string[],
    supportedLanguages: row.supportedLanguages as string[],
    requiredSkills: row.requiredSkills as string[],
    visibility: row.visibility as TaskTemplateRecord["visibility"],
    status: row.status as TaskTemplateRecord["status"],
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    previousVersionId: row.previousVersionId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class TaskTemplateRepository extends BaseRepository {
  async create(params: {
    publicId: string;
    version: number;
    previousVersionId?: string | null;
    createdByUserId?: string | null;
    payload: TaskTemplatePayload;
    status?: "draft" | "published" | "archived";
  }): Promise<TaskTemplateRecord> {
    const row = await prisma.taskTemplate.create({
      data: {
        publicId: params.publicId,
        templateKey: params.payload.templateKey,
        version: params.version,
        name: params.payload.name,
        slug: params.payload.slug,
        description: params.payload.description,
        category: params.payload.category,
        subcategory: params.payload.subcategory ?? null,
        difficulty: params.payload.difficulty,
        estimatedDurationMin: params.payload.estimatedDurationMin ?? null,
        capabilitySet: params.payload.capabilitySet as Prisma.InputJsonValue,
        requiredEvidence:
          params.payload.requiredEvidence as Prisma.InputJsonValue,
        submissionSchema:
          params.payload.submissionSchema as Prisma.InputJsonValue,
        validationRules:
          params.payload.validationRules as Prisma.InputJsonValue,
        reviewRules: params.payload.reviewRules as Prisma.InputJsonValue,
        rewardStrategy: params.payload.rewardStrategy as Prisma.InputJsonValue,
        constraints: params.payload.constraints as Prisma.InputJsonValue,
        supportedPlatforms:
          params.payload.supportedPlatforms as Prisma.InputJsonValue,
        supportedDevices:
          params.payload.supportedDevices as Prisma.InputJsonValue,
        supportedCountries:
          params.payload.supportedCountries as Prisma.InputJsonValue,
        supportedLanguages:
          params.payload.supportedLanguages as Prisma.InputJsonValue,
        requiredSkills: params.payload.requiredSkills as Prisma.InputJsonValue,
        visibility: params.payload.visibility,
        status: params.status ?? "draft",
        metadata: (params.payload.metadata ??
          undefined) as Prisma.InputJsonValue | undefined,
        createdByUserId: params.createdByUserId ?? null,
        updatedByUserId: params.createdByUserId ?? null,
        previousVersionId: params.previousVersionId ?? null,
      },
    });
    return mapRow(row);
  }

  async updateDraft(
    id: string,
    payload: TaskTemplatePayload,
    updatedByUserId?: string | null,
  ): Promise<TaskTemplateRecord> {
    const row = await prisma.taskTemplate.update({
      where: { id },
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        category: payload.category,
        subcategory: payload.subcategory ?? null,
        difficulty: payload.difficulty,
        estimatedDurationMin: payload.estimatedDurationMin ?? null,
        capabilitySet: payload.capabilitySet as Prisma.InputJsonValue,
        requiredEvidence: payload.requiredEvidence as Prisma.InputJsonValue,
        submissionSchema: payload.submissionSchema as Prisma.InputJsonValue,
        validationRules: payload.validationRules as Prisma.InputJsonValue,
        reviewRules: payload.reviewRules as Prisma.InputJsonValue,
        rewardStrategy: payload.rewardStrategy as Prisma.InputJsonValue,
        constraints: payload.constraints as Prisma.InputJsonValue,
        supportedPlatforms: payload.supportedPlatforms as Prisma.InputJsonValue,
        supportedDevices: payload.supportedDevices as Prisma.InputJsonValue,
        supportedCountries: payload.supportedCountries as Prisma.InputJsonValue,
        supportedLanguages: payload.supportedLanguages as Prisma.InputJsonValue,
        requiredSkills: payload.requiredSkills as Prisma.InputJsonValue,
        visibility: payload.visibility,
        metadata: (payload.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        updatedByUserId: updatedByUserId ?? null,
      },
    });
    return mapRow(row);
  }

  async findById(id: string): Promise<TaskTemplateRecord | null> {
    const row = await prisma.taskTemplate.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findByPublicId(publicId: string): Promise<TaskTemplateRecord | null> {
    const row = await prisma.taskTemplate.findUnique({ where: { publicId } });
    return row ? mapRow(row) : null;
  }

  async findByKeyVersion(
    templateKey: string,
    version: number,
  ): Promise<TaskTemplateRecord | null> {
    const row = await prisma.taskTemplate.findUnique({
      where: { templateKey_version: { templateKey, version } },
    });
    return row ? mapRow(row) : null;
  }

  async list(params?: {
    status?: "draft" | "published" | "archived";
    category?: string;
  }): Promise<TaskTemplateRecord[]> {
    const rows = await prisma.taskTemplate.findMany({
      where: {
        status: params?.status,
        category: params?.category,
      },
      orderBy: [{ templateKey: "asc" }, { version: "desc" }],
    });
    return rows.map(mapRow);
  }

  async publish(id: string, updatedByUserId?: string | null): Promise<TaskTemplateRecord> {
    const row = await prisma.taskTemplate.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
        updatedByUserId: updatedByUserId ?? null,
      },
    });
    return mapRow(row);
  }

  async archive(id: string, updatedByUserId?: string | null): Promise<TaskTemplateRecord> {
    const row = await prisma.taskTemplate.update({
      where: { id },
      data: {
        status: "archived",
        archivedAt: new Date(),
        updatedByUserId: updatedByUserId ?? null,
      },
    });
    return mapRow(row);
  }

  async latestVersion(templateKey: string): Promise<number> {
    const row = await prisma.taskTemplate.findFirst({
      where: { templateKey },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return row?.version ?? 0;
  }
}

export const taskTemplateRepository = new TaskTemplateRepository();
