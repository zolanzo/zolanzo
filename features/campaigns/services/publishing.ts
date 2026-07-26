/**
 * Draft / publish validation for campaigns.
 */

import { validateConstraintDefinitions } from "@/constants/constraints";
import { validateRewardStrategy } from "@/constants/reward-strategies";
import { calculateCampaignBudget } from "@/features/campaigns/services/budget-engine";
import { validateCampaignSchedule } from "@/features/campaigns/services/scheduling";
import type { CampaignPayload } from "@/features/campaigns/types";

export type PublishValidationResult = {
  ok: boolean;
  errors: string[];
  publishTarget?: "scheduled" | "active";
};

export function validateDraftCampaign(payload: CampaignPayload): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload.name.trim()) errors.push("name is required");
  if (!payload.slug.trim()) errors.push("slug is required");
  if (!payload.brief.businessObjective.trim()) {
    errors.push("brief.businessObjective is required");
  }
  if (!payload.brief.workerInstructions.trim()) {
    errors.push("brief.workerInstructions is required");
  }
  if (!payload.brief.successMetrics.length) {
    errors.push("brief.successMetrics requires at least one metric");
  }

  const constraints = validateConstraintDefinitions(payload.audienceConstraints);
  if (!constraints.ok) errors.push(...constraints.errors);

  if (payload.rewardStrategyOverride) {
    const reward = validateRewardStrategy(payload.rewardStrategyOverride);
    if (!reward.ok) errors.push(...reward.errors);
  }

  const budget = calculateCampaignBudget({
    kind: payload.budgetKind,
    currency: payload.currency,
    fixedBudgetMinor: payload.budgetMinor,
    targetQuantity: payload.targetQuantity,
    rewardPerUnitMinor: payload.rewardPerUnitMinor,
  });
  if (!budget.isValid) errors.push(...budget.errors);

  const schedule = validateCampaignSchedule({
    mode: payload.scheduleMode,
    timezone: payload.timezone,
    startAt: payload.startAt,
    endAt: payload.endAt,
    recurrenceRule: payload.recurrenceRule,
  });
  if (!schedule.ok) errors.push(...schedule.errors);

  return { ok: errors.length === 0, errors };
}

export function validatePublishCampaign(params: {
  payload: CampaignPayload;
  templateStatus: "draft" | "published" | "archived";
}): PublishValidationResult {
  const draft = validateDraftCampaign(params.payload);
  const errors = [...draft.errors];

  if (params.templateStatus !== "published") {
    errors.push("Task template must be published before campaign publish");
  }
  if (params.payload.targetQuantity < 1) {
    errors.push("targetQuantity must be >= 1 to publish");
  }

  const schedule = validateCampaignSchedule({
    mode: params.payload.scheduleMode,
    timezone: params.payload.timezone,
    startAt: params.payload.startAt,
    endAt: params.payload.endAt,
    recurrenceRule: params.payload.recurrenceRule,
  });

  return {
    ok: errors.length === 0,
    errors,
    publishTarget: schedule.publishTarget,
  };
}
