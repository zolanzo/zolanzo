/**
 * ReviewAssistant — production advisory assistant.
 * Never approves, rejects, or mutates business data.
 */

import { buildEvidenceChecklist } from "@/lib/ai/review/evidence-checklist-builder";
import { evaluateCampaignRules } from "@/lib/ai/review/campaign-rule-evaluator";
import { buildReviewRecommendation } from "@/lib/ai/review/recommendation-builder";
import { buildReviewSummary } from "@/lib/ai/review/review-summary-builder";
import {
  isReviewAssistantEnabled,
  REVIEW_ASSISTANT_MODEL_VERSION,
} from "@/lib/ai/review/review-config";
import { recordReviewAssistantTelemetry } from "@/lib/ai/review/review-telemetry";
import type {
  ReviewAssistance,
  ReviewContextBundle,
} from "@/lib/ai/review/review-types";
import type {
  ReviewAssistant,
  ReviewAssistantInput,
  ReviewAssistantResult,
} from "@/lib/ai/types";

export type AssistReviewInput = {
  context: ReviewContextBundle;
  forceRuleOnly?: boolean;
};

export async function assistReview(
  input: AssistReviewInput,
): Promise<ReviewAssistance> {
  const started = Date.now();

  if (!isReviewAssistantEnabled()) {
    const latencyMs = Date.now() - started;
    recordReviewAssistantTelemetry({
      success: true,
      latencyMs,
      confidence: 0,
      recommendation: "escalate",
      aiAugmented: false,
    });
    return {
      submissionId: input.context.submissionId,
      recommendation: "escalate",
      confidence: 0,
      summary: ["Review assistant disabled — review manually"],
      reasons: ["Engine disabled"],
      warnings: ["No AI/rule assistance applied"],
      missingItems: [],
      suggestedActions: ["Review manually"],
      alternativeAction: null,
      checklist: [],
      campaignRuleChecks: [],
      fraudRiskScore: input.context.fraudRiskScore,
      fraudRiskLevel: input.context.fraudRiskLevel,
      aiAugmented: false,
      fallbackUsed: true,
      advisoryOnly: true,
      modelVersion: REVIEW_ASSISTANT_MODEL_VERSION,
      latencyMs,
    };
  }

  try {
    const checklist = buildEvidenceChecklist(input.context);
    const campaignChecks = evaluateCampaignRules(input.context);
    const recommendation = buildReviewRecommendation({
      ctx: input.context,
      checklist: checklist.items,
      campaignChecks,
      missingItems: checklist.missingItems,
      forceRuleOnly: input.forceRuleOnly,
    });
    const latencyMs = Date.now() - started;
    const assistance = buildReviewSummary({
      ctx: input.context,
      checklist: checklist.items,
      campaignChecks,
      missingItems: checklist.missingItems,
      recommendation,
      latencyMs,
    });

    recordReviewAssistantTelemetry({
      success: true,
      latencyMs,
      confidence: assistance.confidence,
      recommendation: assistance.recommendation,
      aiAugmented: assistance.aiAugmented,
    });

    return assistance;
  } catch (error) {
    const latencyMs = Date.now() - started;
    recordReviewAssistantTelemetry({ success: false, latencyMs });
    throw error;
  }
}

function contextFromSnapshot(
  submissionId: string,
  snap: Record<string, unknown>,
): ReviewContextBundle {
  const evidenceItems = Array.isArray(snap.evidenceItems)
    ? (snap.evidenceItems as ReviewContextBundle["evidenceItems"])
    : [];
  const campaignRules = Array.isArray(snap.campaignRules)
    ? (snap.campaignRules as ReviewContextBundle["campaignRules"])
    : [];

  return {
    submissionId,
    submissionPublicId: (snap.submissionPublicId as string | null) ?? null,
    organizationId: (snap.organizationId as string | null) ?? null,
    campaignId: (snap.campaignId as string | null) ?? null,
    campaignName: (snap.campaignName as string | null) ?? null,
    workerUserId: String(snap.workerUserId ?? "unknown"),
    status: String(snap.status ?? "submitted"),
    requiredEvidenceKinds: Array.isArray(snap.requiredEvidenceKinds)
      ? (snap.requiredEvidenceKinds as string[])
      : [],
    evidenceItems,
    requiredFormFields: Array.isArray(snap.requiredFormFields)
      ? (snap.requiredFormFields as string[])
      : [],
    presentFormFields: Array.isArray(snap.presentFormFields)
      ? (snap.presentFormFields as string[])
      : [],
    gpsPresent: Boolean(snap.gpsPresent),
    gpsWithinBoundary:
      snap.gpsWithinBoundary === null || snap.gpsWithinBoundary === undefined
        ? null
        : Boolean(snap.gpsWithinBoundary),
    identityVerified: Boolean(snap.identityVerified),
    fraudRiskScore: Number(snap.fraudRiskScore ?? 0),
    fraudRiskLevel: (snap.fraudRiskLevel as ReviewContextBundle["fraudRiskLevel"]) ?? "low",
    fraudReasons: Array.isArray(snap.fraudReasons)
      ? (snap.fraudReasons as string[])
      : [],
    fraudWarnings: Array.isArray(snap.fraudWarnings)
      ? (snap.fraudWarnings as string[])
      : [],
    workerApprovalRate: Number(snap.workerApprovalRate ?? 0.7),
    workerCompletedTasks: Number(snap.workerCompletedTasks ?? 0),
    similarSubmissionDetected: Boolean(snap.similarSubmissionDetected),
    similarSubmissionNote: (snap.similarSubmissionNote as string | null) ?? null,
    campaignRules,
    narrativeText: (snap.narrativeText as string | null) ?? null,
  };
}

export const reviewAssistant: ReviewAssistant = {
  async assist(input: ReviewAssistantInput): Promise<ReviewAssistantResult> {
    const ctx =
      (input.knowledgeSnapshot.context as ReviewContextBundle | undefined) ??
      contextFromSnapshot(input.submissionId, input.knowledgeSnapshot);

    const assistance = await assistReview({ context: ctx });

    return {
      summary: assistance.summary.join(" "),
      confidence: assistance.confidence,
      recommendation: assistance.recommendation,
      findings: [
        ...assistance.reasons,
        ...assistance.missingItems.map((m) => `Missing: ${m}`),
      ],
      advisoryOnly: true,
      warnings: assistance.warnings,
      missingItems: assistance.missingItems,
      suggestedActions: assistance.suggestedActions,
      alternativeAction: assistance.alternativeAction,
      checklist: assistance.checklist,
      campaignRuleChecks: assistance.campaignRuleChecks,
    };
  },
};

/** @deprecated Use reviewAssistant */
export const reviewAssistantStub = reviewAssistant;
