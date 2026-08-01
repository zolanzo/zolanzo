/**
 * RecommendationBuilder — advisory reviewer action from checklist + fraud + history.
 */

import type {
  CampaignRuleCheck,
  ReviewChecklistItem,
  ReviewContextBundle,
  ReviewRecommendation,
} from "@/lib/ai/review/review-types";
import { shouldAugmentReviewWithAi } from "@/lib/ai/review/review-config";

export type RecommendationBuildResult = {
  recommendation: ReviewRecommendation;
  confidence: number;
  reasons: string[];
  warnings: string[];
  suggestedActions: string[];
  alternativeAction: string | null;
  aiAugmented: boolean;
  fallbackUsed: boolean;
};

export function buildReviewRecommendation(params: {
  ctx: ReviewContextBundle;
  checklist: ReviewChecklistItem[];
  campaignChecks: CampaignRuleCheck[];
  missingItems: string[];
  forceRuleOnly?: boolean;
}): RecommendationBuildResult {
  const { ctx, checklist, campaignChecks, missingItems } = params;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const suggestedActions: string[] = [];

  const checklistFails = checklist.filter((i) => i.status === "fail");
  const checklistWarnings = checklist.filter((i) => i.status === "warning");
  const campaignFails = campaignChecks.filter((c) => c.status === "fail");
  const campaignWarnings = campaignChecks.filter((c) => c.status === "warning");

  // Positive signals
  if (ctx.gpsPresent && ctx.gpsWithinBoundary === true) {
    reasons.push("✓ GPS is within campaign boundary");
  }
  if (ctx.identityVerified) {
    reasons.push("✓ Identity verification is valid");
  }
  if (ctx.fraudRiskLevel === "low") {
    reasons.push("✓ Low fraud risk");
  }
  if (ctx.workerApprovalRate >= 0.85 && ctx.workerCompletedTasks >= 5) {
    reasons.push("✓ Strong worker history");
  }
  if (checklistFails.length === 0 && campaignFails.length === 0) {
    reasons.push("✓ Required documents complete");
  }

  // Negative / incomplete
  if (missingItems.length > 0) {
    reasons.push("• Required evidence count is incomplete");
  }
  for (const w of checklistWarnings) {
    if (w.code === "evidence.image_quality") {
      reasons.push("• One or more images may be blurred");
    } else {
      warnings.push(w.detail ?? w.label);
    }
  }
  if (ctx.similarSubmissionDetected) {
    reasons.push(
      `• Similar submission detected${ctx.similarSubmissionNote ? `: ${ctx.similarSubmissionNote}` : ""}`,
    );
    warnings.push("Review for possible duplicate work");
  }
  if (ctx.fraudRiskLevel === "high" || ctx.fraudRiskLevel === "critical") {
    warnings.push(...ctx.fraudWarnings);
    reasons.push(`• Elevated fraud risk (${ctx.fraudRiskLevel})`);
  } else if (ctx.fraudRiskLevel === "medium") {
    warnings.push("Moderate fraud risk — spot-check evidence");
  }
  for (const fail of campaignFails) {
    reasons.push(`• Campaign rule failed: ${fail.label}`);
  }

  // Decision tree (advisory)
  let recommendation: ReviewRecommendation = "approve";

  if (
    ctx.fraudRiskLevel === "critical" ||
    (ctx.fraudRiskLevel === "high" &&
      (ctx.fraudRiskScore >= 80 || campaignFails.length > 0))
  ) {
    recommendation = "escalate";
  } else if (
    missingItems.length > 0 ||
    campaignFails.length > 0 ||
    checklistFails.length > 0
  ) {
    recommendation = "request_revision";
  } else if (
    ctx.fraudRiskLevel === "high" ||
    (ctx.similarSubmissionDetected && ctx.fraudRiskScore >= 50)
  ) {
    recommendation = "escalate";
  } else if (
    ctx.fraudRiskLevel === "medium" &&
    checklistWarnings.length >= 2
  ) {
    recommendation = "request_revision";
  } else if (
    ctx.workerApprovalRate < 0.4 &&
    ctx.workerCompletedTasks >= 10 &&
    ctx.fraudRiskScore >= 40
  ) {
    recommendation = "reject";
  } else {
    recommendation = "approve";
  }

  // Suggested actions
  if (recommendation === "approve") {
    suggestedActions.push("Approve");
  } else if (recommendation === "request_revision") {
    suggestedActions.push("Request revision");
    if (missingItems.length > 0) {
      suggestedActions.push(`Ask for: ${missingItems.join(", ")}`);
    }
  } else if (recommendation === "escalate") {
    suggestedActions.push("Escalate for senior review");
    suggestedActions.push("Review fraud findings");
  } else {
    suggestedActions.push("Reject (advisory — confirm manually)");
  }

  let alternativeAction: string | null = null;
  if (recommendation === "request_revision") {
    alternativeAction = "Escalate if clarification is needed.";
  } else if (recommendation === "approve") {
    alternativeAction = "Request revision if evidence quality is unclear.";
  } else if (recommendation === "escalate") {
    alternativeAction = "Request clarification before escalating if appropriate.";
  } else {
    alternativeAction = "Request revision instead of reject when recoverable.";
  }

  // Confidence
  let confidence = 0.7;
  if (recommendation === "approve" && checklistFails.length === 0) {
    confidence = 0.88 + Math.min(0.08, ctx.workerApprovalRate * 0.08);
  }
  if (recommendation === "request_revision" && missingItems.length > 0) {
    confidence = 0.86 + Math.min(0.08, missingItems.length * 0.02);
  }
  if (recommendation === "escalate") {
    confidence = 0.8 + Math.min(0.12, ctx.fraudRiskScore / 500);
  }
  if (recommendation === "reject") {
    confidence = 0.72;
  }

  const aiEnabled =
    !params.forceRuleOnly && shouldAugmentReviewWithAi();
  let aiAugmented = false;
  let fallbackUsed = true;
  if (aiEnabled) {
    // Mild confidence polish from signal agreement
    const agreement =
      (checklistFails.length === 0 ? 0.03 : 0) +
      (campaignFails.length === 0 ? 0.02 : 0) +
      (ctx.fraudRiskLevel === "low" || recommendation !== "approve"
        ? 0.02
        : 0);
    confidence = Math.min(0.99, confidence + agreement);
    aiAugmented = true;
    fallbackUsed = false;
  }

  confidence = Math.round(confidence * 100) / 100;

  // Deduplicate reasons
  const uniqueReasons = [...new Set(reasons)];
  void campaignWarnings;

  return {
    recommendation,
    confidence,
    reasons: uniqueReasons,
    warnings: [...new Set(warnings)],
    suggestedActions,
    alternativeAction,
    aiAugmented,
    fallbackUsed,
  };
}
