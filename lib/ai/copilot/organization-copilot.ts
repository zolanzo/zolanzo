/**
 * OrganizationCopilot — advisory Q&A over org knowledge.
 * Never performs business actions or mutates domain data.
 */

import { resolveOrgCopilotIntent } from "@/lib/ai/copilot/intent-resolver";
import { retrieveOrgKnowledge } from "@/lib/ai/copilot/knowledge-retriever";
import { buildOrgBusinessContext } from "@/lib/ai/copilot/business-context-builder";
import {
  canAccessOrgCopilotIntent,
  type OrgCopilotAuthContext,
} from "@/lib/ai/copilot/permission-filter";
import { generateOrgCopilotResponse } from "@/lib/ai/copilot/response-generator";
import {
  isOrgCopilotEnabled,
  isOrgMemoryEnabled,
  ORG_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/org-config";
import { recordOrgCopilotTelemetry } from "@/lib/ai/copilot/org-telemetry";
import type {
  OrgCopilotIntent,
  OrgCopilotResponse,
  OrgKnowledgeFacts,
} from "@/lib/ai/copilot/org-types";
import type {
  CopilotAnswer,
  CopilotQuery,
  OrganizationCopilot,
} from "@/lib/ai/types";
import {
  appendCopilotMemory,
  getCopilotSessionId,
  readCopilotMemory,
} from "@/lib/ai/memory/session-memory";

/** Process-local last intent per session (not business data). */
const lastIntentBySession = new Map<string, OrgCopilotIntent>();

const FORECAST_INTENTS: OrgCopilotIntent[] = [
  "campaign_performance",
  "campaigns_behind_schedule",
  "completion_rates",
  "assignment_backlog",
  "reviewer_workload",
  "pending_payments",
  "organization_spending",
  "declining_trust",
];

async function maybeAttachForecastAdvice(params: {
  response: OrgCopilotResponse;
  intent: OrgCopilotIntent;
  organizationId: string;
}): Promise<OrgCopilotResponse> {
  if (!FORECAST_INTENTS.includes(params.intent)) return params.response;
  try {
    const { getForecastSnippetForCopilot } = await import(
      "@/lib/analytics/forecast/copilot-bridge"
    );
    const forecastType =
      params.intent === "pending_payments" ||
      params.intent === "organization_spending"
        ? "finance"
        : params.intent === "reviewer_workload"
          ? "reviews"
          : params.intent === "declining_trust"
            ? "trust"
            : params.intent === "assignment_backlog"
              ? "workforce"
              : "campaign";
    const snippet = await getForecastSnippetForCopilot({
      type: forecastType,
      organizationId: params.organizationId,
    });
    if (!snippet) return params.response;
    return {
      ...params.response,
      keyFindings: [
        ...params.response.keyFindings,
        `Forecast (advisory): ${snippet.summary}`,
      ].slice(0, 8),
      recommendations: [
        ...params.response.recommendations,
        ...snippet.recommendations.slice(0, 2).map((action, i) => ({
          code: `forecast_${forecastType}_${i}`,
          label: action,
          workflowHint: "advisory_only",
        })),
      ].slice(0, 6),
    };
  } catch {
    return params.response;
  }
}

export type AskOrgCopilotInput = {
  organizationId: string;
  actorUserId: string;
  question: string;
  auth: OrgCopilotAuthContext;
  facts: OrgKnowledgeFacts;
  threadKey?: string;
  forceRuleOnly?: boolean;
};

export async function askOrganizationCopilot(
  input: AskOrgCopilotInput,
): Promise<OrgCopilotResponse> {
  const started = Date.now();
  const sessionId = getCopilotSessionId({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    threadKey: input.threadKey,
  });

  if (!isOrgCopilotEnabled()) {
    const latencyMs = Date.now() - started;
    const response: OrgCopilotResponse = {
      answer: "Organization Copilot is disabled.",
      confidence: 0,
      intent: "unknown",
      dataSources: [],
      keyFindings: [],
      recommendations: [],
      suggestedFollowUps: [],
      citations: [],
      aiAugmented: false,
      fallbackUsed: true,
      advisoryOnly: true,
      modelVersion: ORG_COPILOT_MODEL_VERSION,
      latencyMs,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      estimatedCostMicroUsd: 0,
    };
    recordOrgCopilotTelemetry({
      success: true,
      latencyMs,
      confidence: 0,
      intent: "unknown",
      aiAugmented: false,
    });
    return response;
  }

  try {
    const previousIntent = isOrgMemoryEnabled()
      ? lastIntentBySession.get(sessionId) ?? null
      : null;

    const { intent, isFollowUp } = resolveOrgCopilotIntent({
      question: input.question,
      previousIntent,
    });

    if (!canAccessOrgCopilotIntent(input.auth, intent)) {
      const latencyMs = Date.now() - started;
      const denial = generateOrgCopilotResponse({
        context: buildOrgBusinessContext({
          facts: input.facts,
          intent,
          question: input.question,
          isFollowUp,
          retrieved: retrieveOrgKnowledge({
            intent,
            facts: {
              ...input.facts,
              campaigns: [],
              workers: [],
              reviewers: [],
              payments: [],
              fraudTrends: [],
            },
          }),
        }),
        forceRuleOnly: true,
        latencyMs,
        denialReason: input.auth.isOrgMember
          ? "Missing permission for this question"
          : "Not a member of this organization",
      });
      recordOrgCopilotTelemetry({
        success: true,
        latencyMs,
        confidence: 0,
        intent,
        aiAugmented: false,
      });
      return denial;
    }

    const retrieved = retrieveOrgKnowledge({
      intent,
      facts: input.facts,
    });

    let recentMessages: CopilotQuery["messages"] = [];
    if (isOrgMemoryEnabled()) {
      appendCopilotMemory(sessionId, {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        message: { role: "user", content: input.question },
      });
      recentMessages = readCopilotMemory(sessionId)?.messages ?? [];
    }

    const context = buildOrgBusinessContext({
      facts: input.facts,
      intent,
      question: input.question,
      isFollowUp,
      retrieved,
      recentMessages,
    });

    const latencyMs = Date.now() - started;
    let response = generateOrgCopilotResponse({
      context,
      forceRuleOnly: input.forceRuleOnly,
      latencyMs,
    });

    response = await maybeAttachForecastAdvice({
      response,
      intent,
      organizationId: input.organizationId,
    });

    if (isOrgMemoryEnabled()) {
      lastIntentBySession.set(sessionId, intent);
      appendCopilotMemory(sessionId, {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        message: { role: "assistant", content: response.answer },
      });
    }

    recordOrgCopilotTelemetry({
      success: true,
      latencyMs: response.latencyMs,
      confidence: response.confidence,
      intent: response.intent,
      aiAugmented: response.aiAugmented,
      promptTokens: response.tokenUsage.promptTokens,
      completionTokens: response.tokenUsage.completionTokens,
      costMicroUsd: response.estimatedCostMicroUsd,
    });

    return response;
  } catch (error) {
    const latencyMs = Date.now() - started;
    recordOrgCopilotTelemetry({ success: false, latencyMs });
    throw error;
  }
}

export function resetOrgCopilotSessionStateForTests(): void {
  lastIntentBySession.clear();
}

/**
 * Adapter for OrganizationCopilot port.
 * Expects knowledgeSnapshot.facts + knowledgeSnapshot.auth.
 */
export const organizationCopilot: OrganizationCopilot = {
  async ask(query: CopilotQuery): Promise<CopilotAnswer> {
    const snap = query.knowledgeSnapshot;
    const question =
      [...query.messages].reverse().find((m) => m.role === "user")?.content ??
      String(snap.question ?? "");

    const facts = snap.facts as OrgKnowledgeFacts | undefined;
    const auth = snap.auth as OrgCopilotAuthContext | undefined;

    if (!facts || !auth) {
      return {
        answer: "Missing organization facts or auth context.",
        citations: [],
        advisoryOnly: true,
      };
    }

    const response = await askOrganizationCopilot({
      organizationId: query.organizationId,
      actorUserId: query.actorUserId,
      question,
      auth,
      facts,
      threadKey: String(snap.threadKey ?? "default"),
      forceRuleOnly: Boolean(snap.forceRuleOnly),
    });

    return {
      answer: response.answer,
      citations: response.citations,
      advisoryOnly: true,
      confidence: response.confidence,
      keyFindings: response.keyFindings,
      recommendations: response.recommendations,
      suggestedFollowUps: response.suggestedFollowUps,
      dataSources: response.dataSources,
      intent: response.intent,
    };
  },
};

/** @deprecated Use organizationCopilot */
export const organizationCopilotStub = organizationCopilot;
