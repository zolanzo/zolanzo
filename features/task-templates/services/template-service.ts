import "server-only";

import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import { validateConstraintDefinitions } from "@/constants/constraints";
import { validateRewardStrategy } from "@/constants/reward-strategies";
import { validateReviewRules } from "@/constants/review-rules";
import { validateValidationRules } from "@/constants/validation-rules";
import {
  alignEvidenceRequirements,
  composeCapabilitySet,
} from "@/features/task-templates/services/capability-composition";
import {
  canArchiveTemplate,
  canEditTemplate,
  canPublishTemplate,
  nextVersionNumber,
  requiresNewVersionForEdit,
} from "@/features/task-templates/services/versioning";
import {
  hydrateRegistry,
  registerTemplateInRegistry,
} from "@/features/task-templates/services/registry";
import { taskTemplateRepository } from "@/features/task-templates/repositories";
import {
  createTaskTemplateSchema,
  type CreateTaskTemplateInput,
} from "@/features/task-templates/validators";
import type { TaskTemplatePayload, TaskTemplateRecord } from "@/features/task-templates/types";

function asPayload(input: CreateTaskTemplateInput): TaskTemplatePayload {
  return input as unknown as TaskTemplatePayload;
}

function validatePayload(input: CreateTaskTemplateInput): TaskTemplatePayload {
  const payload = asPayload(input);
  const composition = composeCapabilitySet(payload.capabilitySet);
  if (!composition.ok) {
    throw new AppError("INVALID_CAPABILITIES", composition.errors.join("; "), 400);
  }

  const evidence = alignEvidenceRequirements(
    payload.capabilitySet,
    payload.requiredEvidence,
  );
  if (!evidence.ok) {
    throw new AppError("INVALID_EVIDENCE", evidence.errors.join("; "), 400);
  }

  const constraints = validateConstraintDefinitions(payload.constraints);
  if (!constraints.ok) {
    throw new AppError("INVALID_CONSTRAINTS", constraints.errors.join("; "), 400);
  }

  const reward = validateRewardStrategy(payload.rewardStrategy);
  if (!reward.ok) {
    throw new AppError("INVALID_REWARD", reward.errors.join("; "), 400);
  }

  const review = validateReviewRules(payload.reviewRules);
  if (!review.ok) {
    throw new AppError("INVALID_REVIEW", review.errors.join("; "), 400);
  }

  const validation = validateValidationRules(payload.validationRules);
  if (!validation.ok) {
    throw new AppError(
      "INVALID_VALIDATION",
      validation.errors.join("; "),
      400,
    );
  }

  return payload;
}

export async function createDraftTemplate(params: {
  input: unknown;
  createdByUserId?: string | null;
}): Promise<ApiResponse<TaskTemplateRecord>> {
  try {
    const parsed = createTaskTemplateSchema.parse(params.input);
    const payload = validatePayload(parsed);

    const existing = await taskTemplateRepository.latestVersion(
      payload.templateKey,
    );
    if (existing > 0) {
      throw new AppError(
        "TEMPLATE_KEY_EXISTS",
        "Template key already exists — create a new version from the published template",
        409,
      );
    }

    const publicId = await generatePublicId("task_template");
    const record = await taskTemplateRepository.create({
      publicId,
      version: 1,
      createdByUserId: params.createdByUserId,
      payload,
      status: "draft",
    });
    registerTemplateInRegistry(record);
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "CREATE_TEMPLATE_FAILED",
      error instanceof Error ? error.message : "Could not create template",
    );
  }
}

export async function updateDraftTemplate(params: {
  id: string;
  input: unknown;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<TaskTemplateRecord>> {
  try {
    const existing = await taskTemplateRepository.findById(params.id);
    if (!existing) {
      throw new AppError("NOT_FOUND", "Template not found", 404);
    }
    if (!canEditTemplate(existing.status)) {
      throw new AppError(
        "IMMUTABLE_TEMPLATE",
        "Published templates are immutable — create a new version",
        409,
      );
    }

    const incoming =
      params.input && typeof params.input === "object"
        ? (params.input as Record<string, unknown>)
        : {};
    const parsed = createTaskTemplateSchema.parse({
      ...incoming,
      templateKey: existing.templateKey,
    });
    const payload = validatePayload(parsed);

    const record = await taskTemplateRepository.updateDraft(
      params.id,
      { ...payload, templateKey: existing.templateKey },
      params.updatedByUserId,
    );
    registerTemplateInRegistry(record);
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("UPDATE_TEMPLATE_FAILED", "Could not update template");
  }
}

export async function publishTemplate(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<TaskTemplateRecord>> {
  try {
    const existing = await taskTemplateRepository.findById(params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Template not found", 404);
    if (!canPublishTemplate(existing.status)) {
      throw new AppError("INVALID_STATUS", "Only drafts can be published", 400);
    }
    validatePayload({
      templateKey: existing.templateKey,
      name: existing.name,
      slug: existing.slug,
      description: existing.description,
      category: existing.category,
      subcategory: existing.subcategory,
      difficulty: existing.difficulty,
      estimatedDurationMin: existing.estimatedDurationMin,
      capabilitySet: existing.capabilitySet,
      requiredEvidence: existing.requiredEvidence,
      submissionSchema: existing.submissionSchema,
      validationRules: existing.validationRules,
      reviewRules: existing.reviewRules,
      rewardStrategy: existing.rewardStrategy,
      constraints: existing.constraints,
      supportedPlatforms: existing.supportedPlatforms,
      supportedDevices: existing.supportedDevices,
      supportedCountries: existing.supportedCountries,
      supportedLanguages: existing.supportedLanguages,
      requiredSkills: existing.requiredSkills,
      visibility: existing.visibility,
      metadata: existing.metadata,
    } as CreateTaskTemplateInput);

    const record = await taskTemplateRepository.publish(
      params.id,
      params.updatedByUserId,
    );
    registerTemplateInRegistry(record);
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("PUBLISH_FAILED", "Could not publish template");
  }
}

export async function archiveTemplate(params: {
  id: string;
  updatedByUserId?: string | null;
}): Promise<ApiResponse<TaskTemplateRecord>> {
  try {
    const existing = await taskTemplateRepository.findById(params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Template not found", 404);
    if (!canArchiveTemplate(existing.status)) {
      throw new AppError("INVALID_STATUS", "Cannot archive this template", 400);
    }
    const record = await taskTemplateRepository.archive(
      params.id,
      params.updatedByUserId,
    );
    registerTemplateInRegistry(record);
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("ARCHIVE_FAILED", "Could not archive template");
  }
}

/**
 * Create a new draft version from a published (or archived) template.
 */
export async function createNewTemplateVersion(params: {
  id: string;
  createdByUserId?: string | null;
}): Promise<ApiResponse<TaskTemplateRecord>> {
  try {
    const existing = await taskTemplateRepository.findById(params.id);
    if (!existing) throw new AppError("NOT_FOUND", "Template not found", 404);
    if (!requiresNewVersionForEdit(existing.status)) {
      throw new AppError(
        "ALREADY_DRAFT",
        "Edit the existing draft instead of creating a version",
        400,
      );
    }

    const latest = await taskTemplateRepository.latestVersion(
      existing.templateKey,
    );
    const publicId = await generatePublicId("task_template");
    const record = await taskTemplateRepository.create({
      publicId,
      version: nextVersionNumber(latest),
      previousVersionId: existing.id,
      createdByUserId: params.createdByUserId,
      payload: {
        templateKey: existing.templateKey,
        name: existing.name,
        slug: existing.slug,
        description: existing.description,
        category: existing.category,
        subcategory: existing.subcategory,
        difficulty: existing.difficulty,
        estimatedDurationMin: existing.estimatedDurationMin,
        capabilitySet: existing.capabilitySet,
        requiredEvidence: existing.requiredEvidence,
        submissionSchema: existing.submissionSchema,
        validationRules: existing.validationRules,
        reviewRules: existing.reviewRules,
        rewardStrategy: existing.rewardStrategy,
        constraints: existing.constraints,
        supportedPlatforms: existing.supportedPlatforms,
        supportedDevices: existing.supportedDevices,
        supportedCountries: existing.supportedCountries,
        supportedLanguages: existing.supportedLanguages,
        requiredSkills: existing.requiredSkills,
        visibility: existing.visibility,
        metadata: existing.metadata,
      },
      status: "draft",
    });
    registerTemplateInRegistry(record);
    return apiSuccess(record);
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("VERSION_FAILED", "Could not create new version");
  }
}

export async function listTemplates(filter?: {
  status?: TaskTemplateRecord["status"];
  category?: string;
}): Promise<TaskTemplateRecord[]> {
  return taskTemplateRepository.list(filter);
}

export async function getTemplateByPublicId(
  publicId: string,
): Promise<TaskTemplateRecord | null> {
  return taskTemplateRepository.findByPublicId(publicId);
}

export async function reloadTemplateRegistry(): Promise<number> {
  const records = await taskTemplateRepository.list();
  hydrateRegistry(records);
  return records.length;
}
