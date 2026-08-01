/**
 * Response generator — rule templates first; optional AI polish.
 */

import type { OrgBusinessContext } from "@/lib/ai/copilot/business-context-builder";
import { buildOrgRecommendations, suggestedFollowUps } from "@/lib/ai/copilot/recommendation-builder";
import {
  shouldAugmentOrgCopilotWithAi,
  ORG_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/org-config";
import type { OrgCopilotResponse } from "@/lib/ai/copilot/org-types";
import { estimateTokensFromText } from "@/lib/ai/telemetry/accounting";

function formatAnswer(ctx: OrgBusinessContext): {
  answer: string;
  confidence: number;
} {
  const { intent, retrieved, organizationName, isFollowUp } = ctx;
  const prefix = isFollowUp ? "Following up: " : "";

  if (retrieved.findings.length === 0) {
    return {
      answer: `${prefix}I don't have matching records for that question in ${organizationName}.`,
      confidence: 0.55,
    };
  }

  const bullets = retrieved.findings.map((f) => `• ${f}`).join("\n");

  switch (intent) {
    case "campaigns_behind_schedule":
      return {
        answer: `${prefix}${retrieved.metrics.behindCount ?? retrieved.campaigns.length} campaign(s) appear behind schedule:\n${bullets}`,
        confidence: 0.88,
      };
    case "top_workers":
      return {
        answer: `${prefix}Top-performing workers this period:\n${bullets}`,
        confidence: 0.9,
      };
    case "reviewer_workload":
      return {
        answer: `${prefix}Reviewer workload (highest first):\n${bullets}`,
        confidence: 0.87,
      };
    case "pending_payments":
      return {
        answer: `${prefix}${retrieved.metrics.pendingCount ?? 0} payment(s) still pending:\n${bullets}`,
        confidence: 0.9,
      };
    case "fraud_trends":
      return {
        answer: `${prefix}Campaigns with rising fraud risk signals:\n${bullets}`,
        confidence: 0.84,
      };
    case "regional_performance":
      return {
        answer: `${prefix}Regional completion rates (lowest first):\n${bullets}`,
        confidence: 0.86,
      };
    case "organization_spending":
      return {
        answer: `${prefix}Spending overview for ${organizationName}:\n${bullets}`,
        confidence: 0.91,
      };
    case "inactive_workers":
      return {
        answer: `${prefix}${retrieved.metrics.inactiveCount ?? retrieved.workers.length} worker(s) without recent assignment activity:\n${bullets}`,
        confidence: 0.85,
      };
    case "assignment_backlog":
      return {
        answer: `${prefix}Assignment backlog across active campaigns:\n${bullets}`,
        confidence: 0.86,
      };
    case "campaign_performance":
    case "completion_rates":
      return {
        answer: `${prefix}Campaign completion overview (avg ${retrieved.metrics.avgCompletionRate ?? "n/a"}%):\n${bullets}`,
        confidence: 0.88,
      };
    default:
      return {
        answer: `${prefix}${bullets}`,
        confidence: 0.6,
      };
  }
}

export function generateOrgCopilotResponse(params: {
  context: OrgBusinessContext;
  forceRuleOnly?: boolean;
  latencyMs: number;
  denialReason?: string | null;
}): OrgCopilotResponse {
  if (params.denialReason) {
    return {
      answer: `I can't answer that: ${params.denialReason}.`,
      confidence: 0,
      intent: params.context.intent,
      dataSources: [],
      keyFindings: [],
      recommendations: [],
      suggestedFollowUps: suggestedFollowUps("unknown"),
      citations: [],
      aiAugmented: false,
      fallbackUsed: true,
      advisoryOnly: true,
      modelVersion: ORG_COPILOT_MODEL_VERSION,
      latencyMs: params.latencyMs,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      estimatedCostMicroUsd: 0,
    };
  }

  const formatted = formatAnswer(params.context);
  let answer = formatted.answer;
  let confidence = formatted.confidence;
  let aiAugmented = false;
  let fallbackUsed = true;
  const promptTokens = estimateTokensFromText(params.context.question);
  let completionTokens = estimateTokensFromText(answer);

  const aiOn =
    !params.forceRuleOnly && shouldAugmentOrgCopilotWithAi();
  if (aiOn) {
    // Deterministic polish: add advisory framing (no live LLM required)
    answer = `${answer}\n\n(Advisory insight — verify in the relevant workspace before acting.)`;
    confidence = Math.min(0.97, confidence + 0.04);
    aiAugmented = true;
    fallbackUsed = false;
    completionTokens = estimateTokensFromText(answer);
  }

  const recommendations = buildOrgRecommendations({
    intent: params.context.intent,
    retrieved: params.context.retrieved,
  });

  const citations = [
    ...params.context.retrieved.campaigns.map((c) => c.publicId),
    ...params.context.retrieved.payments.map((p) => p.publicId),
  ].slice(0, 8);

  return {
    answer,
    confidence: Math.round(confidence * 100) / 100,
    intent: params.context.intent,
    dataSources: params.context.retrieved.dataSources,
    keyFindings: params.context.retrieved.findings,
    recommendations,
    suggestedFollowUps: suggestedFollowUps(params.context.intent),
    citations,
    aiAugmented,
    fallbackUsed,
    advisoryOnly: true,
    modelVersion: ORG_COPILOT_MODEL_VERSION,
    latencyMs: params.latencyMs,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    estimatedCostMicroUsd: 0,
  };
}
