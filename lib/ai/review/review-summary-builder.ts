/**
 * ReviewSummaryBuilder — executive summary for reviewer workspace.
 */

import { isReviewSummariesEnabled } from "@/lib/ai/review/review-config";
import type {
  CampaignRuleCheck,
  ReviewAssistance,
  ReviewChecklistItem,
  ReviewContextBundle,
  ReviewRecommendation,
} from "@/lib/ai/review/review-types";
import { REVIEW_ASSISTANT_MODEL_VERSION } from "@/lib/ai/review/review-types";
import type { RecommendationBuildResult } from "@/lib/ai/review/recommendation-builder";

function recommendationLabel(rec: ReviewRecommendation): string {
  switch (rec) {
    case "approve":
      return "APPROVE";
    case "reject":
      return "REJECT";
    case "request_revision":
      return "REQUEST REVISION";
    case "escalate":
      return "ESCALATE";
  }
}

export function buildReviewSummary(params: {
  ctx: ReviewContextBundle;
  checklist: ReviewChecklistItem[];
  campaignChecks: CampaignRuleCheck[];
  missingItems: string[];
  recommendation: RecommendationBuildResult;
  latencyMs: number;
  summariesEnabled?: boolean;
}): ReviewAssistance {
  const summariesOn =
    params.summariesEnabled ?? isReviewSummariesEnabled();

  const summary: string[] = [];
  if (summariesOn) {
    // Prefer recommendation reasons as executive bullets (already humanized)
    for (const reason of params.recommendation.reasons.slice(0, 6)) {
      summary.push(reason.replace(/^[✓•]\s*/, "").trim());
    }
    if (summary.length === 0) {
      summary.push("No significant issues detected from available signals.");
    }
  } else {
    summary.push(
      `Recommendation: ${recommendationLabel(params.recommendation.recommendation)}`,
    );
  }

  return {
    submissionId: params.ctx.submissionId,
    recommendation: params.recommendation.recommendation,
    confidence: params.recommendation.confidence,
    summary,
    reasons: params.recommendation.reasons,
    warnings:
      params.recommendation.warnings.length > 0
        ? params.recommendation.warnings
        : ["None"],
    missingItems: params.missingItems,
    suggestedActions: params.recommendation.suggestedActions,
    alternativeAction: params.recommendation.alternativeAction,
    checklist: params.checklist,
    campaignRuleChecks: params.campaignChecks,
    fraudRiskScore: params.ctx.fraudRiskScore,
    fraudRiskLevel: params.ctx.fraudRiskLevel,
    aiAugmented: params.recommendation.aiAugmented,
    fallbackUsed: params.recommendation.fallbackUsed,
    advisoryOnly: true,
    modelVersion: REVIEW_ASSISTANT_MODEL_VERSION,
    latencyMs: params.latencyMs,
  };
}

export { recommendationLabel };
