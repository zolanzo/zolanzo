import { describe, expect, it } from "vitest";
import { calculateCampaignBudget } from "@/features/campaigns/services/budget-engine";
import { mergeEligibilityRules } from "@/features/campaigns/services/eligibility";
import {
  canTransitionCampaign,
  isEditableCampaignStatus,
} from "@/features/campaigns/services/lifecycle";
import { validateCampaignSchedule } from "@/features/campaigns/services/scheduling";
import {
  validateDraftCampaign,
  validatePublishCampaign,
} from "@/features/campaigns/services/publishing";
import { isGenerationStrategy } from "@/constants/generation-strategies";
import { isValidPublicId } from "@/lib/public-id/format";
import { formatYearSequentialPublicId } from "@/lib/public-id/format";
import type { CampaignPayload } from "@/features/campaigns/types";
import type { TemplateConstraint } from "@/constants/constraints";

const baseBrief: CampaignPayload["brief"] = {
  businessObjective: "Grow quality coverage",
  successMetrics: ["100 approved"],
  workerInstructions: "Follow the template carefully",
  qualityExpectations: "Clear evidence",
  acceptableExamples: ["Sharp photo"],
  unacceptableExamples: ["Blurry photo"],
  reviewerGuidance: "Reject incomplete work",
};

function payload(
  overrides: Partial<CampaignPayload> = {},
): CampaignPayload {
  return {
    name: "Test Campaign",
    slug: "test-campaign",
    description: "A test business contract",
    objective: "Validate engine",
    visibility: "organization",
    priority: "normal",
    category: "testing",
    tags: ["test"],
    brief: baseBrief,
    generationStrategy: "on_demand",
    generationConfig: null,
    generationPolicy: "fixed_quantity",
    generationPolicyConfig: { policy: "fixed_quantity", quantity: 10 },
    targetQuantity: 10,
    budgetKind: "quantity_times_reward",
    currency: "NGN",
    rewardPerUnitMinor: 1000,
    rewardStrategyOverride: null,
    countryScope: ["NG"],
    languageScope: ["en"],
    deviceScope: [],
    audienceConstraints: [],
    claimPolicies: [
      { kind: "first_come_first_served" },
      { kind: "one_active_per_campaign" },
      { kind: "max_concurrent_assignments", max: 10 },
    ],
    reservationTimeoutSeconds: 120,
    scheduleMode: "immediate",
    timezone: "Africa/Lagos",
    startAt: null,
    endAt: null,
    recurrenceRule: null,
    metadata: null,
    ...overrides,
  };
}

describe("campaign lifecycle", () => {
  it("allows draft → active and blocks archived → active", () => {
    expect(canTransitionCampaign("draft", "active")).toBe(true);
    expect(canTransitionCampaign("archived", "active")).toBe(false);
    expect(isEditableCampaignStatus("draft")).toBe(true);
    expect(isEditableCampaignStatus("active")).toBe(false);
  });
});

describe("budget engine", () => {
  it("computes quantity × reward", () => {
    const snap = calculateCampaignBudget({
      kind: "quantity_times_reward",
      currency: "NGN",
      targetQuantity: 50,
      rewardPerUnitMinor: 150000,
    });
    expect(snap.budgetMinor).toBe(7_500_000);
    expect(snap.projectedCompletionCostMinor).toBe(7_500_000);
    expect(snap.remainingBudgetMinor).toBe(7_500_000);
    expect(snap.isValid).toBe(true);
  });

  it("validates fixed budget vs projected cost", () => {
    const ok = calculateCampaignBudget({
      kind: "fixed",
      currency: "NGN",
      fixedBudgetMinor: 10_000_000,
      targetQuantity: 50,
      rewardPerUnitMinor: 150000,
      reservedBudgetMinor: 1_000_000,
      spentBudgetMinor: 500_000,
    });
    expect(ok.isValid).toBe(true);
    expect(ok.remainingBudgetMinor).toBe(8_500_000);

    const bad = calculateCampaignBudget({
      kind: "fixed",
      currency: "NGN",
      fixedBudgetMinor: 1_000_000,
      targetQuantity: 50,
      rewardPerUnitMinor: 150000,
    });
    expect(bad.isValid).toBe(false);
  });
});

describe("generation strategies", () => {
  it("recognizes supported strategies", () => {
    expect(isGenerationStrategy("pre_generated")).toBe(true);
    expect(isGenerationStrategy("on_demand")).toBe(true);
    expect(isGenerationStrategy("batch")).toBe(true);
    expect(isGenerationStrategy("streaming")).toBe(true);
    expect(isGenerationStrategy("api_driven")).toBe(true);
    expect(isGenerationStrategy("magic")).toBe(false);
  });
});

describe("eligibility merge", () => {
  it("merges org → template → campaign with campaign winning same id", () => {
    const org: TemplateConstraint = {
      id: "trust",
      kind: "worker",
      op: "min_trust_score",
      params: { min: 40 },
      enforcement: "hard",
    };
    const template: TemplateConstraint = {
      id: "trust",
      kind: "worker",
      op: "min_trust_score",
      params: { min: 60 },
      enforcement: "hard",
    };
    const campaign: TemplateConstraint = {
      id: "trust",
      kind: "worker",
      op: "min_trust_score",
      params: { min: 70 },
      enforcement: "hard",
    };
    const extra: TemplateConstraint = {
      id: "ng_only",
      kind: "location",
      op: "country_in",
      params: { countries: ["NG"] },
      enforcement: "hard",
    };

    const merged = mergeEligibilityRules({
      organizationPolicies: { constraints: [org] },
      templateConstraints: [template],
      campaignConstraints: [campaign, extra],
    });

    expect(merged.ok).toBe(true);
    expect(merged.sourceById.trust).toBe("campaign");
    expect(merged.sourceById.ng_only).toBe("campaign");
    const trust = merged.constraints.find((c) => c.id === "trust");
    expect(trust?.params.min).toBe(70);
  });
});

describe("publishing validation", () => {
  it("validates drafts and publish requirements", () => {
    expect(validateDraftCampaign(payload()).ok).toBe(true);

    const publishOk = validatePublishCampaign({
      payload: payload(),
      templateStatus: "published",
    });
    expect(publishOk.ok).toBe(true);
    expect(publishOk.publishTarget).toBe("active");

    const publishBad = validatePublishCampaign({
      payload: payload(),
      templateStatus: "draft",
    });
    expect(publishBad.ok).toBe(false);

    const scheduled = validatePublishCampaign({
      payload: payload({
        scheduleMode: "scheduled",
        startAt: "2030-01-01T00:00:00.000Z",
      }),
      templateStatus: "published",
    });
    expect(scheduled.ok).toBe(true);
    expect(scheduled.publishTarget).toBe("scheduled");
  });

  it("validates timezone-aware schedule", () => {
    const result = validateCampaignSchedule({
      mode: "scheduled",
      timezone: "Africa/Lagos",
      startAt: "2030-06-01T10:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    expect(result.publishTarget).toBe("scheduled");
  });
});

describe("campaign public ids", () => {
  it("formats CMP year-sequential ids", () => {
    const id = formatYearSequentialPublicId("campaign", "2026", 1);
    expect(id).toBe("CMP-2026-000001");
    expect(isValidPublicId("campaign", id)).toBe(true);
  });
});
