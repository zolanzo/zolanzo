/**
 * Phase 4.1D — AI Review Assistant tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildEvidenceChecklist } from "@/lib/ai/review/evidence-checklist-builder";
import { evaluateCampaignRules } from "@/lib/ai/review/campaign-rule-evaluator";
import { buildReviewRecommendation } from "@/lib/ai/review/recommendation-builder";
import { buildReviewSummary } from "@/lib/ai/review/review-summary-builder";
import { assistReview, reviewAssistant } from "@/lib/ai/review/review-assistant";
import {
  recordReviewerFeedback,
  resetReviewerFeedbackForTests,
  listReviewerFeedback,
} from "@/lib/ai/review/reviewer-feedback";
import {
  isReviewAssistantEnabled,
  isReviewSummariesEnabled,
  isReviewFeedbackEnabled,
} from "@/lib/ai/review/review-config";
import {
  getReviewAssistantTelemetrySnapshot,
  resetReviewAssistantTelemetryForTests,
} from "@/lib/ai/review/review-telemetry";
import type { ReviewContextBundle } from "@/lib/ai/review/review-types";

const ORIGINAL_ENV = { ...process.env };

function ctx(
  overrides: Partial<ReviewContextBundle> = {},
): ReviewContextBundle {
  return {
    submissionId: "sub_1",
    submissionPublicId: "SUB-1",
    organizationId: "org_1",
    campaignId: "cmp_1",
    campaignName: "Field Survey",
    workerUserId: "worker_1",
    status: "submitted",
    requiredEvidenceKinds: ["image", "gps"],
    evidenceItems: [
      {
        id: "e1",
        kind: "image",
        label: "Photo",
        contentHash: "h1",
        sizeBytes: 90_000,
        replacedAt: null,
      },
      {
        id: "e2",
        kind: "gps",
        label: "GPS",
        contentHash: null,
        sizeBytes: null,
        replacedAt: null,
      },
    ],
    requiredFormFields: [],
    presentFormFields: [],
    gpsPresent: true,
    gpsWithinBoundary: true,
    identityVerified: true,
    fraudRiskScore: 12,
    fraudRiskLevel: "low",
    fraudReasons: [],
    fraudWarnings: [],
    workerApprovalRate: 0.92,
    workerCompletedTasks: 20,
    similarSubmissionDetected: false,
    similarSubmissionNote: null,
    campaignRules: [],
    narrativeText: "Visited the store and captured evidence.",
    ...overrides,
  };
}

beforeEach(() => {
  resetReviewAssistantTelemetryForTests();
  resetReviewerFeedbackForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AI_REVIEW_ASSISTANT;
  delete process.env.AI_REVIEW_SUMMARIES;
  delete process.env.AI_REVIEW_FEEDBACK;
  delete process.env.AI_ENABLED;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults review assistant flags on", () => {
    expect(isReviewAssistantEnabled()).toBe(true);
    expect(isReviewSummariesEnabled()).toBe(true);
    expect(isReviewFeedbackEnabled()).toBe(true);
  });

  it("respects AI_REVIEW_ASSISTANT=0", () => {
    process.env.AI_REVIEW_ASSISTANT = "0";
    expect(isReviewAssistantEnabled()).toBe(false);
  });
});

describe("EvidenceChecklistBuilder", () => {
  it("passes when required evidence present", () => {
    const result = buildEvidenceChecklist(ctx());
    expect(result.missingItems).toEqual([]);
    expect(result.completenessScore).toBeGreaterThanOrEqual(80);
  });

  it("lists missing required kinds", () => {
    const result = buildEvidenceChecklist(
      ctx({
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "Photo",
            contentHash: "h1",
            sizeBytes: 90_000,
            replacedAt: null,
          },
        ],
      }),
    );
    expect(result.missingItems).toContain("gps");
  });

  it("warns on tiny images", () => {
    const result = buildEvidenceChecklist(
      ctx({
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "Blurry",
            contentHash: "h1",
            sizeBytes: 500,
            replacedAt: null,
          },
          {
            id: "e2",
            kind: "gps",
            label: "GPS",
            contentHash: null,
            sizeBytes: null,
            replacedAt: null,
          },
        ],
      }),
    );
    expect(
      result.items.some(
        (i) => i.code === "evidence.image_quality" && i.status === "warning",
      ),
    ).toBe(true);
  });
});

describe("CampaignRuleEvaluator", () => {
  it("evaluates required photo count", () => {
    const checks = evaluateCampaignRules(
      ctx({
        campaignRules: [
          {
            id: "r1",
            kind: "required_photo_count",
            label: "Campaign A requires three photos",
            params: { min: 3 },
          },
        ],
      }),
    );
    expect(checks[0]?.status).toBe("fail");
    expect(checks[0]?.detail).toMatch(/Found 1/);
  });

  it("evaluates GPS radius rule", () => {
    const checks = evaluateCampaignRules(
      ctx({
        gpsWithinBoundary: false,
        campaignRules: [
          {
            id: "r2",
            kind: "gps_radius_m",
            label: "Campaign B requires GPS within 500 m",
            params: { radiusM: 500 },
          },
        ],
      }),
    );
    expect(checks[0]?.status).toBe("fail");
  });

  it("evaluates manager approval", () => {
    const checks = evaluateCampaignRules(
      ctx({
        campaignRules: [
          {
            id: "r3",
            kind: "manager_approval",
            label: "Campaign C requires manager approval",
            params: { field: "manager_approval" },
          },
        ],
        presentFormFields: [],
      }),
    );
    expect(checks[0]?.status).toBe("fail");
  });
});

describe("RecommendationBuilder + Summary", () => {
  it("recommends approve for clean submission", () => {
    const context = ctx();
    const checklist = buildEvidenceChecklist(context);
    const rules = evaluateCampaignRules(context);
    const rec = buildReviewRecommendation({
      ctx: context,
      checklist: checklist.items,
      campaignChecks: rules,
      missingItems: checklist.missingItems,
      forceRuleOnly: true,
    });
    expect(rec.recommendation).toBe("approve");
    expect(rec.confidence).toBeGreaterThanOrEqual(0.85);
    expect(rec.fallbackUsed).toBe(true);

    const summary = buildReviewSummary({
      ctx: context,
      checklist: checklist.items,
      campaignChecks: rules,
      missingItems: checklist.missingItems,
      recommendation: rec,
      latencyMs: 5,
    });
    expect(summary.advisoryOnly).toBe(true);
    expect(summary.summary.length).toBeGreaterThan(0);
    expect(summary.warnings).toContain("None");
  });

  it("recommends request_revision when evidence missing", () => {
    const context = ctx({
      evidenceItems: [
        {
          id: "e1",
          kind: "image",
          label: "Photo",
          contentHash: "h1",
          sizeBytes: 90_000,
          replacedAt: null,
        },
      ],
      requiredFormFields: ["receipt_photo", "supervisor_signature"],
      presentFormFields: [],
    });
    const checklist = buildEvidenceChecklist(context);
    const rules = evaluateCampaignRules(context);
    const rec = buildReviewRecommendation({
      ctx: context,
      checklist: checklist.items,
      campaignChecks: rules,
      missingItems: checklist.missingItems,
      forceRuleOnly: true,
    });
    expect(rec.recommendation).toBe("request_revision");
    expect(checklist.missingItems.length).toBeGreaterThan(0);
    expect(rec.alternativeAction).toMatch(/Escalate/i);
  });

  it("recommends escalate on high fraud", () => {
    const context = ctx({
      fraudRiskScore: 88,
      fraudRiskLevel: "critical",
      fraudWarnings: ["Manual review recommended"],
    });
    const checklist = buildEvidenceChecklist(context);
    const rules = evaluateCampaignRules(context);
    const rec = buildReviewRecommendation({
      ctx: context,
      checklist: checklist.items,
      campaignChecks: rules,
      missingItems: checklist.missingItems,
      forceRuleOnly: true,
    });
    expect(rec.recommendation).toBe("escalate");
  });

  it("augments confidence when AI_ENABLED", () => {
    process.env.AI_ENABLED = "1";
    const context = ctx();
    const checklist = buildEvidenceChecklist(context);
    const rules = evaluateCampaignRules(context);
    const ruleOnly = buildReviewRecommendation({
      ctx: context,
      checklist: checklist.items,
      campaignChecks: rules,
      missingItems: checklist.missingItems,
      forceRuleOnly: true,
    });
    const withAi = buildReviewRecommendation({
      ctx: context,
      checklist: checklist.items,
      campaignChecks: rules,
      missingItems: checklist.missingItems,
      forceRuleOnly: false,
    });
    expect(withAi.aiAugmented).toBe(true);
    expect(withAi.confidence).toBeGreaterThanOrEqual(ruleOnly.confidence);
  });
});

describe("assistReview pipeline", () => {
  it("returns full assistance payload", async () => {
    const assistance = await assistReview({
      context: ctx({
        requiredEvidenceKinds: ["image", "gps", "file"],
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "Photo",
            contentHash: "h1",
            sizeBytes: 500,
            replacedAt: null,
          },
        ],
        similarSubmissionDetected: true,
        similarSubmissionNote: "from yesterday",
        fraudRiskScore: 20,
        fraudRiskLevel: "low",
      }),
      forceRuleOnly: true,
    });
    expect(assistance.recommendation).toBe("request_revision");
    expect(assistance.missingItems.length).toBeGreaterThan(0);
    expect(assistance.summary.length).toBeGreaterThan(0);
    expect(assistance.advisoryOnly).toBe(true);
    expect(getReviewAssistantTelemetrySnapshot().assisted).toBe(1);
  });

  it("falls back when disabled", async () => {
    process.env.AI_REVIEW_ASSISTANT = "false";
    const assistance = await assistReview({
      context: ctx(),
      forceRuleOnly: true,
    });
    expect(assistance.fallbackUsed).toBe(true);
    expect(assistance.summary[0]).toMatch(/disabled/i);
  });

  it("ReviewAssistant port works from knowledge snapshot", async () => {
    const result = await reviewAssistant.assist({
      submissionId: "sub_x",
      knowledgeSnapshot: {
        workerUserId: "w1",
        identityVerified: true,
        gpsPresent: true,
        gpsWithinBoundary: true,
        fraudRiskScore: 5,
        fraudRiskLevel: "low",
        requiredEvidenceKinds: ["image"],
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "a",
            contentHash: "h",
            sizeBytes: 20_000,
            replacedAt: null,
          },
        ],
        workerApprovalRate: 0.9,
        workerCompletedTasks: 10,
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.recommendation).toBe("approve");
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe("ReviewerFeedbackRecorder", () => {
  it("records feedback without affecting recommendations", async () => {
    const before = await assistReview({
      context: ctx(),
      forceRuleOnly: true,
    });
    const entry = recordReviewerFeedback({
      submissionId: before.submissionId,
      assistanceModelVersion: before.modelVersion,
      recommendation: before.recommendation,
      feedback: "helpful",
      reviewerUserId: "rev_1",
    });
    expect(entry?.feedback).toBe("helpful");
    expect(listReviewerFeedback(5)).toHaveLength(1);

    const after = await assistReview({
      context: ctx(),
      forceRuleOnly: true,
    });
    expect(after.recommendation).toBe(before.recommendation);

    const telemetry = getReviewAssistantTelemetrySnapshot();
    expect(telemetry.feedbackHelpful).toBe(1);
  });

  it("skips recording when feedback flag off", () => {
    process.env.AI_REVIEW_FEEDBACK = "0";
    expect(
      recordReviewerFeedback({
        submissionId: "s",
        assistanceModelVersion: "x",
        recommendation: "approve",
        feedback: "incorrect",
      }),
    ).toBeNull();
  });
});
