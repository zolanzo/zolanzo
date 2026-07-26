import "server-only";

import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import { campaignRepository } from "@/features/campaigns/repositories";
import { taskTemplateRepository } from "@/features/task-templates/repositories";
import {
  taskInstanceRepository,
  type TaskInstanceCreateRow,
} from "@/features/tasks/repositories";
import { previewGeneration } from "@/features/tasks/services/preview";
import { resolveGenerationQuantity } from "@/features/tasks/services/policies";
import { buildInventoryAnalytics } from "@/features/tasks/services/inventory";
import {
  assertTaskInstanceTransition,
} from "@/features/tasks/services/lifecycle";
import {
  generateTaskInstancesSchema,
  previewGenerationSchema,
} from "@/features/tasks/validators";
import type {
  GenerationPreview,
  InventoryAnalytics,
  TaskInstancePriority,
  TaskInstanceRecord,
} from "@/features/tasks/types";
import type { TaskInstanceStatus } from "@/constants/work-states";
import type {
  GenerationPolicy,
  GenerationPolicyConfig,
} from "@/constants/generation-policies";
import type { GenerationStrategy } from "@/constants/generation-strategies";

const GENERATABLE_CAMPAIGN_STATUSES = new Set([
  "active",
  "scheduled",
  "paused",
]);

async function loadGenerationContext(campaignId: string) {
  const campaign = await campaignRepository.findById(campaignId);
  if (!campaign) {
    throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  }
  if (!GENERATABLE_CAMPAIGN_STATUSES.has(campaign.status)) {
    throw new AppError(
      "CAMPAIGN_NOT_READY",
      `Cannot generate instances for campaign status ${campaign.status}`,
      409,
    );
  }

  const template = await taskTemplateRepository.findById(
    campaign.taskTemplateId,
  );
  if (!template) {
    throw new AppError("TEMPLATE_NOT_FOUND", "Task template not found", 404);
  }
  if (template.status !== "published") {
    throw new AppError(
      "TEMPLATE_NOT_PUBLISHED",
      "Pinned template must be published",
      409,
    );
  }

  const inventory = await taskInstanceRepository.countByStatus(campaignId);
  return { campaign, template, inventory };
}

export async function previewTaskInstanceGeneration(params: {
  input: unknown;
}): Promise<ApiResponse<GenerationPreview>> {
  try {
    const parsed = previewGenerationSchema.parse(params.input);
    const { campaign, inventory } = await loadGenerationContext(
      parsed.campaignId,
    );

    const preview = previewGeneration({
      campaignId: campaign.id,
      campaignPublicId: campaign.publicId,
      strategy: campaign.generationStrategy,
      policy: campaign.generationPolicy,
      policyConfig: campaign.generationPolicyConfig ?? null,
      targetQuantity: campaign.targetQuantity,
      rewardPerUnitMinor: campaign.rewardPerUnitMinor,
      currency: campaign.currency,
      inventory,
      quantityOverride: parsed.quantityOverride,
    });

    return apiSuccess(preview);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PREVIEW_FAILED",
      error instanceof Error ? error.message : "Could not preview generation",
    );
  }
}

export async function generateTaskInstances(params: {
  input: unknown;
}): Promise<
  ApiResponse<{
    created: number;
    instances: TaskInstanceRecord[];
    preview: GenerationPreview;
  }>
> {
  try {
    const parsed = generateTaskInstancesSchema.parse(params.input);
    const { campaign, template, inventory } = await loadGenerationContext(
      parsed.campaignId,
    );

    const policy = campaign.generationPolicy as GenerationPolicy;
    const policyConfig =
      campaign.generationPolicyConfig as GenerationPolicyConfig | null;
    const strategy = campaign.generationStrategy as GenerationStrategy;

    const resolution = resolveGenerationQuantity({
      policy,
      config: policyConfig,
      targetQuantity: campaign.targetQuantity,
      inventory,
      quantityOverride: parsed.quantityOverride,
    });
    if (!resolution.ok) {
      throw new AppError(
        "POLICY_INVALID",
        resolution.errors.join("; "),
        400,
      );
    }

    const preview = previewGeneration({
      campaignId: campaign.id,
      campaignPublicId: campaign.publicId,
      strategy,
      policy,
      policyConfig,
      targetQuantity: campaign.targetQuantity,
      rewardPerUnitMinor: campaign.rewardPerUnitMinor,
      currency: campaign.currency,
      inventory,
      quantityOverride: parsed.quantityOverride,
    });

    const quantity = preview.expectedQuantity;
    if (quantity === 0) {
      return apiSuccess({
        created: 0,
        instances: [],
        preview,
      });
    }

    const startSeq = (await taskInstanceRepository.maxSequence(campaign.id)) + 1;
    const expiresAt = parsed.expiresInHours
      ? new Date(Date.now() + parsed.expiresInHours * 60 * 60 * 1000)
      : null;
    const status: TaskInstanceStatus = parsed.releaseToAvailable
      ? "available"
      : "generated";
    const priority = campaign.priority as TaskInstancePriority;

    const rows: TaskInstanceCreateRow[] = [];
    for (let i = 0; i < quantity; i += 1) {
      const publicId = await generatePublicId("task");
      rows.push({
        publicId,
        campaignId: campaign.id,
        taskTemplateId: template.id,
        taskTemplateVersion: template.version,
        sequenceNumber: startSeq + i,
        generationStrategy: strategy,
        generationPolicy: policy,
        generationPolicyConfig: policyConfig,
        status,
        priority,
        reserved: false,
        expiresAt,
        campaignPublicId: campaign.publicId,
        templatePublicId: template.publicId,
        metadata: parsed.metadata ?? { seeded: false },
      });
    }

    await taskInstanceRepository.createMany(rows);
    const instances = await taskInstanceRepository.listByCampaign(
      campaign.id,
    );
    const createdSlice = instances.filter(
      (row) =>
        row.sequenceNumber >= startSeq &&
        row.sequenceNumber < startSeq + quantity,
    );

    return apiSuccess({
      created: quantity,
      instances: createdSlice,
      preview,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "GENERATE_FAILED",
      error instanceof Error ? error.message : "Could not generate instances",
    );
  }
}

export async function getCampaignInventory(
  campaignId: string,
): Promise<ApiResponse<InventoryAnalytics>> {
  try {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
    }
    const counts = await taskInstanceRepository.countByStatus(campaignId);
    return apiSuccess(
      buildInventoryAnalytics({
        counts,
        targetQuantity: campaign.targetQuantity,
      }),
    );
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "INVENTORY_FAILED",
      error instanceof Error ? error.message : "Could not load inventory",
    );
  }
}

export async function transitionTaskInstance(params: {
  id: string;
  to: TaskInstanceStatus;
}): Promise<ApiResponse<TaskInstanceRecord>> {
  try {
    const existing = await taskInstanceRepository.findById(params.id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Task instance not found", 404);
    }
    assertTaskInstanceTransition(existing.status, params.to);

    const reserved = params.to === "reserved";
    const record = await taskInstanceRepository.setStatus({
      id: params.id,
      status: params.to,
      reserved,
      reservedAt: reserved ? new Date() : params.to === "available" ? null : undefined,
      archivedAt:
        params.to === "cancelled" || params.to === "expired"
          ? new Date()
          : undefined,
    });
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "TRANSITION_FAILED",
      error instanceof Error ? error.message : "Could not transition instance",
    );
  }
}

export async function getTaskInstanceByPublicId(
  publicId: string,
): Promise<TaskInstanceRecord | null> {
  return taskInstanceRepository.findByPublicId(publicId);
}

export async function listTaskInstances(params: {
  campaignId: string;
  status?: TaskInstanceStatus;
}): Promise<TaskInstanceRecord[]> {
  return taskInstanceRepository.listByCampaign(
    params.campaignId,
    params.status,
  );
}
