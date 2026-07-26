import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  CampaignPayload,
  CampaignRecord,
} from "@/features/campaigns/types";
import type { CampaignStatus } from "@/constants/work-states";
import { BaseRepository } from "@/repositories/base";
import { calculateCampaignBudget } from "@/features/campaigns/services/budget-engine";

function mapRow(row: {
  id: string;
  publicId: string;
  organizationId: string;
  clientUserId: string;
  taskTemplateId: string;
  name: string;
  slug: string;
  description: string;
  objective: string;
  status: string;
  visibility: string;
  priority: string;
  category: string;
  tags: Prisma.JsonValue;
  brief: Prisma.JsonValue;
  generationStrategy: string;
  generationConfig: Prisma.JsonValue | null;
  generationPolicy: string;
  generationPolicyConfig: Prisma.JsonValue | null;
  targetQuantity: number;
  completedQuantity: number;
  approvedQuantity: number;
  rejectedQuantity: number;
  budgetKind: string;
  currency: string;
  budgetMinor: number;
  reservedBudgetMinor: number;
  spentBudgetMinor: number;
  rewardPerUnitMinor: number;
  rewardStrategyOverride: Prisma.JsonValue | null;
  countryScope: Prisma.JsonValue;
  languageScope: Prisma.JsonValue;
  deviceScope: Prisma.JsonValue;
  audienceConstraints: Prisma.JsonValue;
  claimPolicies: Prisma.JsonValue;
  reservationTimeoutSeconds: number;
  scheduleMode: string;
  timezone: string;
  startAt: Date | null;
  endAt: Date | null;
  recurrenceRule: string | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  clonedFromId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}): CampaignRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    organizationId: row.organizationId,
    clientUserId: row.clientUserId,
    taskTemplateId: row.taskTemplateId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    objective: row.objective,
    status: row.status as CampaignStatus,
    visibility: row.visibility as CampaignRecord["visibility"],
    priority: row.priority as CampaignRecord["priority"],
    category: row.category,
    tags: row.tags as string[],
    brief: row.brief as CampaignRecord["brief"],
    generationStrategy:
      row.generationStrategy as CampaignRecord["generationStrategy"],
    generationConfig:
      (row.generationConfig as CampaignRecord["generationConfig"]) ?? null,
    generationPolicy:
      row.generationPolicy as CampaignRecord["generationPolicy"],
    generationPolicyConfig:
      (row.generationPolicyConfig as CampaignRecord["generationPolicyConfig"]) ??
      null,
    targetQuantity: row.targetQuantity,
    completedQuantity: row.completedQuantity,
    approvedQuantity: row.approvedQuantity,
    rejectedQuantity: row.rejectedQuantity,
    budgetKind: row.budgetKind as CampaignRecord["budgetKind"],
    currency: row.currency,
    budgetMinor: row.budgetMinor,
    reservedBudgetMinor: row.reservedBudgetMinor,
    spentBudgetMinor: row.spentBudgetMinor,
    rewardPerUnitMinor: row.rewardPerUnitMinor,
    rewardStrategyOverride:
      (row.rewardStrategyOverride as CampaignRecord["rewardStrategyOverride"]) ??
      null,
    countryScope: row.countryScope as string[],
    languageScope: row.languageScope as string[],
    deviceScope: row.deviceScope as string[],
    audienceConstraints:
      row.audienceConstraints as CampaignRecord["audienceConstraints"],
    claimPolicies: row.claimPolicies as CampaignRecord["claimPolicies"],
    reservationTimeoutSeconds: row.reservationTimeoutSeconds,
    scheduleMode: row.scheduleMode as CampaignRecord["scheduleMode"],
    timezone: row.timezone,
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    recurrenceRule: row.recurrenceRule,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    clonedFromId: row.clonedFromId,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function resolveBudgetMinor(payload: CampaignPayload): number {
  const snap = calculateCampaignBudget({
    kind: payload.budgetKind,
    currency: payload.currency,
    fixedBudgetMinor: payload.budgetMinor,
    targetQuantity: payload.targetQuantity,
    rewardPerUnitMinor: payload.rewardPerUnitMinor,
  });
  return snap.budgetMinor;
}

function toCreateData(params: {
  publicId: string;
  organizationId: string;
  clientUserId: string;
  taskTemplateId: string;
  payload: CampaignPayload;
  status?: CampaignStatus;
  createdByUserId?: string | null;
  clonedFromId?: string | null;
}): Prisma.CampaignCreateInput {
  const budgetMinor = resolveBudgetMinor(params.payload);
  return {
    publicId: params.publicId,
    organization: { connect: { id: params.organizationId } },
    client: { connect: { id: params.clientUserId } },
    taskTemplate: { connect: { id: params.taskTemplateId } },
    name: params.payload.name,
    slug: params.payload.slug,
    description: params.payload.description,
    objective: params.payload.objective,
    status: params.status ?? "draft",
    visibility: params.payload.visibility,
    priority: params.payload.priority,
    category: params.payload.category,
    tags: params.payload.tags as Prisma.InputJsonValue,
    brief: params.payload.brief as Prisma.InputJsonValue,
    generationStrategy: params.payload.generationStrategy,
    generationConfig: (params.payload.generationConfig ??
      undefined) as Prisma.InputJsonValue | undefined,
    generationPolicy: params.payload.generationPolicy,
    generationPolicyConfig: (params.payload.generationPolicyConfig ??
      undefined) as Prisma.InputJsonValue | undefined,
    targetQuantity: params.payload.targetQuantity,
    budgetKind: params.payload.budgetKind,
    currency: params.payload.currency,
    budgetMinor,
    rewardPerUnitMinor: params.payload.rewardPerUnitMinor,
    rewardStrategyOverride: (params.payload.rewardStrategyOverride ??
      undefined) as Prisma.InputJsonValue | undefined,
    countryScope: params.payload.countryScope as Prisma.InputJsonValue,
    languageScope: params.payload.languageScope as Prisma.InputJsonValue,
    deviceScope: params.payload.deviceScope as Prisma.InputJsonValue,
    audienceConstraints: params.payload
      .audienceConstraints as Prisma.InputJsonValue,
    claimPolicies: params.payload.claimPolicies as Prisma.InputJsonValue,
    reservationTimeoutSeconds: params.payload.reservationTimeoutSeconds,
    scheduleMode: params.payload.scheduleMode,
    timezone: params.payload.timezone,
    startAt: params.payload.startAt ? new Date(params.payload.startAt) : null,
    endAt: params.payload.endAt ? new Date(params.payload.endAt) : null,
    recurrenceRule: params.payload.recurrenceRule ?? null,
    createdBy: params.createdByUserId
      ? { connect: { id: params.createdByUserId } }
      : undefined,
    updatedBy: params.createdByUserId
      ? { connect: { id: params.createdByUserId } }
      : undefined,
    clonedFrom: params.clonedFromId
      ? { connect: { id: params.clonedFromId } }
      : undefined,
    metadata: (params.payload.metadata ?? undefined) as
      | Prisma.InputJsonValue
      | undefined,
  };
}

export class CampaignRepository extends BaseRepository {
  async create(params: {
    publicId: string;
    organizationId: string;
    clientUserId: string;
    taskTemplateId: string;
    payload: CampaignPayload;
    status?: CampaignStatus;
    createdByUserId?: string | null;
    clonedFromId?: string | null;
  }): Promise<CampaignRecord> {
    const row = await prisma.campaign.create({
      data: toCreateData(params),
    });
    return mapRow(row);
  }

  async updateEditable(
    id: string,
    payload: CampaignPayload,
    updatedByUserId?: string | null,
  ): Promise<CampaignRecord> {
    const budgetMinor = resolveBudgetMinor(payload);
    const row = await prisma.campaign.update({
      where: { id },
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        objective: payload.objective,
        visibility: payload.visibility,
        priority: payload.priority,
        category: payload.category,
        tags: payload.tags as Prisma.InputJsonValue,
        brief: payload.brief as Prisma.InputJsonValue,
        generationStrategy: payload.generationStrategy,
        generationConfig: (payload.generationConfig ??
          undefined) as Prisma.InputJsonValue | undefined,
        generationPolicy: payload.generationPolicy,
        generationPolicyConfig: (payload.generationPolicyConfig ??
          undefined) as Prisma.InputJsonValue | undefined,
        targetQuantity: payload.targetQuantity,
        budgetKind: payload.budgetKind,
        currency: payload.currency,
        budgetMinor,
        rewardPerUnitMinor: payload.rewardPerUnitMinor,
        rewardStrategyOverride: (payload.rewardStrategyOverride ??
          undefined) as Prisma.InputJsonValue | undefined,
        countryScope: payload.countryScope as Prisma.InputJsonValue,
        languageScope: payload.languageScope as Prisma.InputJsonValue,
        deviceScope: payload.deviceScope as Prisma.InputJsonValue,
        audienceConstraints:
          payload.audienceConstraints as Prisma.InputJsonValue,
        claimPolicies: payload.claimPolicies as Prisma.InputJsonValue,
        reservationTimeoutSeconds: payload.reservationTimeoutSeconds,
        scheduleMode: payload.scheduleMode,
        timezone: payload.timezone,
        startAt: payload.startAt ? new Date(payload.startAt) : null,
        endAt: payload.endAt ? new Date(payload.endAt) : null,
        recurrenceRule: payload.recurrenceRule ?? null,
        metadata: (payload.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        updatedByUserId: updatedByUserId ?? null,
      },
    });
    return mapRow(row);
  }

  async findById(id: string): Promise<CampaignRecord | null> {
    const row = await prisma.campaign.findUnique({ where: { id } });
    return row ? mapRow(row) : null;
  }

  async findByPublicId(publicId: string): Promise<CampaignRecord | null> {
    const row = await prisma.campaign.findUnique({ where: { publicId } });
    return row ? mapRow(row) : null;
  }

  async list(params?: {
    organizationId?: string;
    status?: CampaignStatus;
    category?: string;
  }): Promise<CampaignRecord[]> {
    const rows = await prisma.campaign.findMany({
      where: {
        organizationId: params?.organizationId,
        status: params?.status,
        category: params?.category,
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapRow);
  }

  async setStatus(params: {
    id: string;
    status: CampaignStatus;
    updatedByUserId?: string | null;
    publishedAt?: Date | null;
    archivedAt?: Date | null;
  }): Promise<CampaignRecord> {
    const row = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: params.status,
        updatedByUserId: params.updatedByUserId ?? null,
        ...(params.publishedAt !== undefined
          ? { publishedAt: params.publishedAt }
          : {}),
        ...(params.archivedAt !== undefined
          ? { archivedAt: params.archivedAt }
          : {}),
      },
    });
    return mapRow(row);
  }
}

export const campaignRepository = new CampaignRepository();
