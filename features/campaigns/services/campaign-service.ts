import "server-only";

import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import type { CampaignStatus } from "@/constants/work-states";
import { campaignRepository } from "@/features/campaigns/repositories";
import { taskTemplateRepository } from "@/features/task-templates/repositories";
import {
  assertTransition,
  canTransitionCampaign,
  isEditableCampaignStatus,
} from "@/features/campaigns/services/lifecycle";
import { validateDraftCampaign, validatePublishCampaign } from "@/features/campaigns/services/publishing";
import { mergeEligibilityRules } from "@/features/campaigns/services/eligibility";
import { calculateCampaignBudget } from "@/features/campaigns/services/budget-engine";
import {
  createCampaignSchema,
  updateCampaignSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "@/features/campaigns/validators";
import type {
  CampaignPayload,
  CampaignRecord,
  OrgEligibilityPolicy,
} from "@/features/campaigns/types";
import type { TemplateConstraint } from "@/constants/constraints";

function toPayload(input: CreateCampaignInput): CampaignPayload {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    objective: input.objective,
    visibility: input.visibility,
    priority: input.priority,
    category: input.category,
    tags: input.tags,
    brief: input.brief,
    generationStrategy:
      input.generationStrategy as CampaignPayload["generationStrategy"],
    generationConfig: input.generationConfig ?? null,
    generationPolicy:
      input.generationPolicy as CampaignPayload["generationPolicy"],
    generationPolicyConfig:
      (input.generationPolicyConfig as CampaignPayload["generationPolicyConfig"]) ??
      null,
    targetQuantity: input.targetQuantity,
    budgetKind: input.budgetKind,
    currency: input.currency,
    budgetMinor: input.budgetMinor,
    rewardPerUnitMinor: input.rewardPerUnitMinor,
    rewardStrategyOverride: input.rewardStrategyOverride ?? null,
    countryScope: input.countryScope,
    languageScope: input.languageScope,
    deviceScope: input.deviceScope,
    audienceConstraints:
      input.audienceConstraints as CampaignPayload["audienceConstraints"],
    claimPolicies: input.claimPolicies as CampaignPayload["claimPolicies"],
    reservationTimeoutSeconds: input.reservationTimeoutSeconds,
    scheduleMode: input.scheduleMode as CampaignPayload["scheduleMode"],
    timezone: input.timezone,
    startAt: input.startAt ?? null,
    endAt: input.endAt ?? null,
    recurrenceRule: input.recurrenceRule ?? null,
    metadata: input.metadata ?? null,
  };
}

function recordToPayload(record: CampaignRecord): CampaignPayload {
  return {
    name: record.name,
    slug: record.slug,
    description: record.description,
    objective: record.objective,
    visibility: record.visibility,
    priority: record.priority,
    category: record.category,
    tags: record.tags,
    brief: record.brief,
    generationStrategy: record.generationStrategy,
    generationConfig: record.generationConfig,
    generationPolicy: record.generationPolicy,
    generationPolicyConfig: record.generationPolicyConfig,
    targetQuantity: record.targetQuantity,
    budgetKind: record.budgetKind,
    currency: record.currency,
    budgetMinor: record.budgetMinor,
    rewardPerUnitMinor: record.rewardPerUnitMinor,
    rewardStrategyOverride: record.rewardStrategyOverride,
    countryScope: record.countryScope,
    languageScope: record.languageScope,
    deviceScope: record.deviceScope,
    audienceConstraints: record.audienceConstraints,
    claimPolicies: record.claimPolicies,
    reservationTimeoutSeconds: record.reservationTimeoutSeconds,
    scheduleMode: record.scheduleMode,
    timezone: record.timezone,
    startAt: record.startAt,
    endAt: record.endAt,
    recurrenceRule: record.recurrenceRule,
    metadata: record.metadata,
  };
}

function mergeUpdate(
  current: CampaignRecord,
  patch: UpdateCampaignInput,
): CampaignPayload {
  const base = recordToPayload(current);
  return {
    ...base,
    ...patch,
    brief: patch.brief ?? base.brief,
    tags: patch.tags ?? base.tags,
    generationStrategy: (patch.generationStrategy ??
      base.generationStrategy) as CampaignPayload["generationStrategy"],
    generationConfig:
      patch.generationConfig !== undefined
        ? patch.generationConfig
        : base.generationConfig,
    generationPolicy: (patch.generationPolicy ??
      base.generationPolicy) as CampaignPayload["generationPolicy"],
    generationPolicyConfig:
      patch.generationPolicyConfig !== undefined
        ? (patch.generationPolicyConfig as CampaignPayload["generationPolicyConfig"])
        : base.generationPolicyConfig,
    rewardStrategyOverride:
      patch.rewardStrategyOverride !== undefined
        ? patch.rewardStrategyOverride
        : base.rewardStrategyOverride,
    countryScope: patch.countryScope ?? base.countryScope,
    languageScope: patch.languageScope ?? base.languageScope,
    deviceScope: patch.deviceScope ?? base.deviceScope,
    audienceConstraints: (patch.audienceConstraints ??
      base.audienceConstraints) as CampaignPayload["audienceConstraints"],
    claimPolicies: (patch.claimPolicies ??
      base.claimPolicies) as CampaignPayload["claimPolicies"],
    reservationTimeoutSeconds:
      patch.reservationTimeoutSeconds ?? base.reservationTimeoutSeconds,
    scheduleMode: (patch.scheduleMode ??
      base.scheduleMode) as CampaignPayload["scheduleMode"],
    metadata: patch.metadata !== undefined ? patch.metadata : base.metadata,
  };
}

export async function createDraftCampaign(params: {
  input: unknown;
  createdByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  try {
    const parsed = createCampaignSchema.parse(params.input);
    const payload = toPayload(parsed);
    const draftCheck = validateDraftCampaign(payload);
    if (!draftCheck.ok) {
      throw new AppError("INVALID_CAMPAIGN", draftCheck.errors.join("; "), 400);
    }

    const template = await taskTemplateRepository.findById(
      parsed.taskTemplateId,
    );
    if (!template) {
      throw new AppError("TEMPLATE_NOT_FOUND", "Task template not found", 404);
    }

    const publicId = await generatePublicId("campaign");
    const record = await campaignRepository.create({
      publicId,
      organizationId: parsed.organizationId,
      clientUserId: parsed.clientUserId,
      taskTemplateId: parsed.taskTemplateId,
      payload,
      status: "draft",
      createdByUserId: params.createdByUserId,
    });
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CREATE_CAMPAIGN_FAILED",
      error instanceof Error ? error.message : "Could not create campaign",
    );
  }
}

export async function updateDraftCampaign(params: {
  id: string;
  input: unknown;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  try {
    const existing = await campaignRepository.findById(params.id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Campaign not found", 404);
    }
    if (!isEditableCampaignStatus(existing.status)) {
      throw new AppError(
        "NOT_EDITABLE",
        "Only draft or pending_review campaigns can be edited",
        409,
      );
    }

    const patch = updateCampaignSchema.parse(params.input);
    const payload = mergeUpdate(existing, patch);
    const draftCheck = validateDraftCampaign(payload);
    if (!draftCheck.ok) {
      throw new AppError("INVALID_CAMPAIGN", draftCheck.errors.join("; "), 400);
    }

    const record = await campaignRepository.updateEditable(
      params.id,
      payload,
      params.updatedByUserId,
    );
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "UPDATE_CAMPAIGN_FAILED",
      error instanceof Error ? error.message : "Could not update campaign",
    );
  }
}

export async function submitCampaignForReview(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  return transitionCampaign({
    id: params.id,
    to: "pending_review",
    updatedByUserId: params.updatedByUserId,
  });
}

export async function publishCampaign(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  try {
    const existing = await campaignRepository.findById(params.id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Campaign not found", 404);
    }

    const template = await taskTemplateRepository.findById(
      existing.taskTemplateId,
    );
    if (!template) {
      throw new AppError("TEMPLATE_NOT_FOUND", "Task template not found", 404);
    }

    const payload = recordToPayload(existing);
    const check = validatePublishCampaign({
      payload,
      templateStatus: template.status,
    });
    if (!check.ok || !check.publishTarget) {
      throw new AppError(
        "PUBLISH_INVALID",
        check.errors.join("; ") || "Publish validation failed",
        400,
      );
    }

    const target = check.publishTarget;
    if (!canTransitionCampaign(existing.status, target)) {
      throw new AppError(
        "INVALID_TRANSITION",
        `Cannot publish from ${existing.status} to ${target}`,
        409,
      );
    }

    const record = await campaignRepository.setStatus({
      id: params.id,
      status: target,
      updatedByUserId: params.updatedByUserId,
      publishedAt: new Date(),
    });
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PUBLISH_CAMPAIGN_FAILED",
      error instanceof Error ? error.message : "Could not publish campaign",
    );
  }
}

export async function transitionCampaign(params: {
  id: string;
  to: CampaignStatus;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  try {
    const existing = await campaignRepository.findById(params.id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Campaign not found", 404);
    }
    assertTransition(existing.status, params.to);

    const record = await campaignRepository.setStatus({
      id: params.id,
      status: params.to,
      updatedByUserId: params.updatedByUserId,
      archivedAt: params.to === "archived" ? new Date() : undefined,
    });
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "TRANSITION_FAILED",
      error instanceof Error ? error.message : "Could not transition campaign",
    );
  }
}

export async function archiveCampaign(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  return transitionCampaign({
    id: params.id,
    to: "archived",
    updatedByUserId: params.updatedByUserId,
  });
}

export async function pauseCampaign(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  return transitionCampaign({
    id: params.id,
    to: "paused",
    updatedByUserId: params.updatedByUserId,
  });
}

export async function resumeCampaign(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  return transitionCampaign({
    id: params.id,
    to: "active",
    updatedByUserId: params.updatedByUserId,
  });
}

/**
 * Duplicate = new draft copy with new slug/publicId (same org/client/template).
 */
export async function duplicateCampaign(params: {
  id: string;
  slugSuffix?: string;
  createdByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  try {
    const existing = await campaignRepository.findById(params.id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Campaign not found", 404);
    }

    const suffix = params.slugSuffix ?? `copy-${Date.now().toString(36)}`;
    const payload = recordToPayload(existing);
    payload.slug = `${existing.slug}-${suffix}`.slice(0, 120);
    payload.name = `${existing.name} (Copy)`;

    const publicId = await generatePublicId("campaign");
    const record = await campaignRepository.create({
      publicId,
      organizationId: existing.organizationId,
      clientUserId: existing.clientUserId,
      taskTemplateId: existing.taskTemplateId,
      payload,
      status: "draft",
      createdByUserId: params.createdByUserId,
      clonedFromId: existing.id,
    });
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "DUPLICATE_FAILED",
      error instanceof Error ? error.message : "Could not duplicate campaign",
    );
  }
}

/** Clone is an alias of duplicate with explicit naming for product UX. */
export async function cloneCampaign(params: {
  id: string;
  createdByUserId?: string | null;
}): Promise<ApiResponse<CampaignRecord>> {
  return duplicateCampaign({
    id: params.id,
    slugSuffix: `clone-${Date.now().toString(36)}`,
    createdByUserId: params.createdByUserId,
  });
}

export async function listCampaigns(filter?: {
  organizationId?: string;
  status?: CampaignStatus;
  category?: string;
}): Promise<CampaignRecord[]> {
  return campaignRepository.list(filter);
}

export async function getCampaignByPublicId(
  publicId: string,
): Promise<CampaignRecord | null> {
  return campaignRepository.findByPublicId(publicId);
}

export async function getCampaignBudgetSnapshot(id: string) {
  const campaign = await campaignRepository.findById(id);
  if (!campaign) return null;
  return calculateCampaignBudget({
    kind: campaign.budgetKind,
    currency: campaign.currency,
    fixedBudgetMinor: campaign.budgetMinor,
    targetQuantity: campaign.targetQuantity,
    rewardPerUnitMinor: campaign.rewardPerUnitMinor,
    reservedBudgetMinor: campaign.reservedBudgetMinor,
    spentBudgetMinor: campaign.spentBudgetMinor,
  });
}

export async function resolveCampaignEligibility(params: {
  campaignId: string;
  organizationPolicies?: OrgEligibilityPolicy | null;
}): Promise<
  ApiResponse<{
    constraints: TemplateConstraint[];
    sourceById: Record<string, "organization" | "template" | "campaign">;
  }>
> {
  try {
    const campaign = await campaignRepository.findById(params.campaignId);
    if (!campaign) {
      throw new AppError("NOT_FOUND", "Campaign not found", 404);
    }
    const template = await taskTemplateRepository.findById(
      campaign.taskTemplateId,
    );
    if (!template) {
      throw new AppError("TEMPLATE_NOT_FOUND", "Task template not found", 404);
    }

    const merged = mergeEligibilityRules({
      templateConstraints: template.constraints,
      campaignConstraints: campaign.audienceConstraints,
      organizationPolicies: params.organizationPolicies,
    });
    if (!merged.ok) {
      throw new AppError("ELIGIBILITY_INVALID", merged.errors.join("; "), 400);
    }
    return apiSuccess({
      constraints: merged.constraints,
      sourceById: merged.sourceById,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "ELIGIBILITY_FAILED",
      error instanceof Error ? error.message : "Could not resolve eligibility",
    );
  }
}
