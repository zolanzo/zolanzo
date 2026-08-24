"use server";

import { requireAuthContext } from "@/lib/auth/session";
import { apiError, type ApiResponse } from "@/lib/api/response";
import { createDraftCampaign } from "@/features/campaigns/services/campaign-service";
import {
  splitScopeList,
  validateHirerOpportunityInput,
} from "@/features/campaigns/services/hirer-opportunity";
import { nairaToMinor } from "@/lib/money/ngn";
import type { CampaignRecord } from "@/features/campaigns/types";
import { taskTemplateRepository } from "@/features/task-templates/repositories";

function campaignSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "campaign"}-${Date.now().toString(36)}`;
}

export async function createHirerOpportunityAction(input: {
  title: string;
  category: string;
  description: string;
  instructions: string;
  requirements: string;
  rewardNaira: number;
  slots: number;
  taskTemplateId: string;
  countries: string;
  languages: string;
  platform?: string;
}): Promise<ApiResponse<CampaignRecord>> {
  const ctx = await requireAuthContext();
  const organizationId = ctx.user.activeOrganizationId;
  if (!organizationId) {
    return apiError(
      "NO_ORG",
      "Join or create an organization before publishing campaigns.",
    );
  }

  const validated = validateHirerOpportunityInput(input);
  if (!validated.ok) {
    return apiError("INVALID_CAMPAIGN", validated.errors.join("; "));
  }

  const template = await taskTemplateRepository.findById(input.taskTemplateId);
  if (!template) {
    return apiError("TEMPLATE_NOT_FOUND", "Task template not found.");
  }
  if (template.status !== "published") {
    return apiError(
      "TEMPLATE_NOT_PUBLISHED",
      "Only published task templates can be used for marketplace campaigns.",
    );
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const instructions = input.instructions.trim();
  const rewardPerUnitMinor = nairaToMinor(validated.rewardNaira);
  const quality = input.requirements.trim() || instructions;
  const countries = splitScopeList(input.countries);
  const languages = splitScopeList(input.languages);
  const platform = (input.platform ?? "").trim();
  const category =
    input.category.trim() || platform || template.category || "General";

  return createDraftCampaign({
    createdByUserId: ctx.user.id,
    input: {
      organizationId,
      clientUserId: ctx.user.id,
      taskTemplateId: input.taskTemplateId,
      name: title,
      slug: campaignSlug(title),
      description,
      objective: description.slice(0, 2000),
      visibility: "platform",
      category,
      tags: platform ? [platform] : [],
      brief: {
        businessObjective: description.slice(0, 4000),
        successMetrics: ["Approved submissions"],
        workerInstructions: instructions,
        qualityExpectations: quality,
        acceptableExamples: [],
        unacceptableExamples: [],
        reviewerGuidance:
          "Approve when submitted proof matches the instructions.",
      },
      generationStrategy: "on_demand",
      generationPolicy: "fixed_quantity",
      generationPolicyConfig: {
        policy: "fixed_quantity",
        quantity: validated.slots,
      },
      targetQuantity: validated.slots,
      budgetKind: "quantity_times_reward",
      currency: "NGN",
      rewardPerUnitMinor,
      countryScope: countries,
      languageScope: languages,
      timezone: "Africa/Lagos",
    },
  });
}
