/**
 * Worker response generator — rule templates + optional AI polish.
 */

import {
  buildAssignmentCoachLines,
  buildProgressCoachLines,
} from "@/lib/ai/copilot/assignment-context-builder";
import {
  buildWorkerRecommendations,
  workerSuggestedFollowUps,
} from "@/lib/ai/copilot/worker-recommendation-builder";
import {
  shouldAugmentWorkerCopilotWithAi,
  WORKER_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/worker-config";
import type {
  WorkerCopilotResponse,
  WorkerKnowledgeFacts,
} from "@/lib/ai/copilot/worker-types";
import type { WorkerRetrievedKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";
import { estimateTokensFromText } from "@/lib/ai/telemetry/accounting";

export type WorkerBusinessContext = {
  facts: WorkerKnowledgeFacts;
  retrieved: WorkerRetrievedKnowledge;
  question: string;
  isFollowUp: boolean;
};

export function generateWorkerCopilotResponse(params: {
  context: WorkerBusinessContext;
  forceRuleOnly?: boolean;
  latencyMs: number;
  denialReason?: string | null;
}): WorkerCopilotResponse {
  if (params.denialReason) {
    return {
      answer: `I can't answer that: ${params.denialReason}.`,
      confidence: 0,
      intent: params.context.retrieved.intent,
      dataSources: [],
      keyFindings: [],
      recommendations: [],
      suggestedFollowUps: workerSuggestedFollowUps("unknown"),
      citations: [],
      assignmentCoach: null,
      progressSummary: null,
      aiAugmented: false,
      fallbackUsed: true,
      advisoryOnly: true,
      modelVersion: WORKER_COPILOT_MODEL_VERSION,
      latencyMs: params.latencyMs,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      estimatedCostMicroUsd: 0,
    };
  }

  const { context } = params;
  const prefix = context.isFollowUp ? "Following up: " : "";
  const bullets = context.retrieved.findings.map((f) => `• ${f}`).join("\n");
  let answer =
    context.retrieved.findings.length > 0
      ? `${prefix}${bullets}`
      : `${prefix}I don't have matching records for that yet.`;
  let confidence = context.retrieved.findings.length > 0 ? 0.88 : 0.55;

  const intent = context.retrieved.intent;
  let assignmentCoach: string[] | null = null;
  let progressSummary: string[] | null = null;

  if (intent === "assignment_coach" || intent === "missing_evidence") {
    assignmentCoach = buildAssignmentCoachLines(
      context.retrieved.assignments[0],
    );
    answer = `${prefix}Assignment coach:\n${assignmentCoach.map((l) => `• ${l}`).join("\n")}`;
    confidence = 0.9;
  }
  if (intent === "progress") {
    progressSummary = buildProgressCoachLines(
      context.facts,
      context.retrieved,
    );
    answer = `${prefix}Your progress:\n${progressSummary.map((l) => `• ${l}`).join("\n")}`;
    confidence = 0.91;
  }

  let aiAugmented = false;
  let fallbackUsed = true;
  if (!params.forceRuleOnly && shouldAugmentWorkerCopilotWithAi()) {
    answer = `${answer}\n\n(Advisory — confirm in your assignment workspace before acting.)`;
    confidence = Math.min(0.97, confidence + 0.04);
    aiAugmented = true;
    fallbackUsed = false;
  }

  const recommendations = buildWorkerRecommendations({
    intent,
    facts: context.facts,
    retrieved: context.retrieved,
  });

  const promptTokens = estimateTokensFromText(context.question);
  const completionTokens = estimateTokensFromText(answer);

  return {
    answer,
    confidence: Math.round(confidence * 100) / 100,
    intent,
    dataSources: context.retrieved.dataSources,
    keyFindings: context.retrieved.findings,
    recommendations,
    suggestedFollowUps: workerSuggestedFollowUps(intent),
    citations: context.retrieved.assignments.map((a) => a.publicId).slice(0, 8),
    assignmentCoach,
    progressSummary,
    aiAugmented,
    fallbackUsed,
    advisoryOnly: true,
    modelVersion: WORKER_COPILOT_MODEL_VERSION,
    latencyMs: params.latencyMs,
    tokenUsage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
    estimatedCostMicroUsd: 0,
  };
}
