/**
 * WorkerCopilot — advisory Q&A for the signed-in worker.
 * Never performs business actions or mutates domain data.
 * Self-scoped only — never other workers or org-private data.
 */

import { resolveWorkerCopilotIntent } from "@/lib/ai/copilot/worker-intent-resolver";
import { retrieveWorkerKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";
import {
  canAccessWorkerCopilotIntent,
  type WorkerCopilotAuthContext,
} from "@/lib/ai/copilot/worker-permission-filter";
import { generateWorkerCopilotResponse } from "@/lib/ai/copilot/worker-response-generator";
import {
  isWorkerCopilotEnabled,
  isWorkerMemoryEnabled,
  WORKER_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/worker-config";
import { recordWorkerCopilotTelemetry } from "@/lib/ai/copilot/worker-telemetry";
import type {
  WorkerCopilotIntent,
  WorkerCopilotResponse,
  WorkerKnowledgeFacts,
} from "@/lib/ai/copilot/worker-types";
import type {
  CopilotAnswer,
  CopilotQuery,
  WorkerCopilot,
} from "@/lib/ai/types";
import {
  appendCopilotMemory,
  getCopilotSessionId,
  readCopilotMemory,
} from "@/lib/ai/memory/session-memory";

/** Process-local last intent per session (not business data). */
const lastIntentBySession = new Map<string, WorkerCopilotIntent>();

export type AskWorkerCopilotInput = {
  workerUserId: string;
  actorUserId: string;
  question: string;
  auth: WorkerCopilotAuthContext;
  facts: WorkerKnowledgeFacts;
  /** Personal org / workspace id for session keying only */
  sessionOrganizationId?: string;
  threadKey?: string;
  forceRuleOnly?: boolean;
};

export async function askWorkerCopilot(
  input: AskWorkerCopilotInput,
): Promise<WorkerCopilotResponse> {
  const started = Date.now();
  const organizationId =
    input.sessionOrganizationId ?? `worker:${input.workerUserId}`;
  const sessionId = getCopilotSessionId({
    organizationId,
    actorUserId: input.actorUserId,
    threadKey: input.threadKey,
  });

  if (!isWorkerCopilotEnabled()) {
    const latencyMs = Date.now() - started;
    const response: WorkerCopilotResponse = {
      answer: "Worker Copilot is disabled.",
      confidence: 0,
      intent: "unknown",
      dataSources: [],
      keyFindings: [],
      recommendations: [],
      suggestedFollowUps: [],
      citations: [],
      assignmentCoach: null,
      progressSummary: null,
      aiAugmented: false,
      fallbackUsed: true,
      advisoryOnly: true,
      modelVersion: WORKER_COPILOT_MODEL_VERSION,
      latencyMs,
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      estimatedCostMicroUsd: 0,
    };
    recordWorkerCopilotTelemetry({
      success: true,
      latencyMs,
      confidence: 0,
      intent: "unknown",
      aiAugmented: false,
    });
    return response;
  }

  try {
    const previousIntent = isWorkerMemoryEnabled()
      ? lastIntentBySession.get(sessionId) ?? null
      : null;

    const { intent, isFollowUp } = resolveWorkerCopilotIntent({
      question: input.question,
      previousIntent,
    });

    if (!canAccessWorkerCopilotIntent(input.auth, intent)) {
      const latencyMs = Date.now() - started;
      const denial = generateWorkerCopilotResponse({
        context: {
          facts: input.facts,
          retrieved: retrieveWorkerKnowledge({
            intent,
            facts: {
              ...input.facts,
              assignments: [],
              submissions: [],
              payments: [],
            },
          }),
          question: input.question,
          isFollowUp,
        },
        forceRuleOnly: true,
        latencyMs,
        denialReason:
          input.auth.actorUserId !== input.auth.workerUserId
            ? "You can only ask about your own worker account"
            : "Missing permission for this question",
      });
      recordWorkerCopilotTelemetry({
        success: true,
        latencyMs,
        confidence: 0,
        intent,
        aiAugmented: false,
      });
      return denial;
    }

    // Harden: facts must already be self-scoped
    if (input.facts.workerUserId !== input.actorUserId) {
      const latencyMs = Date.now() - started;
      const denial = generateWorkerCopilotResponse({
        context: {
          facts: input.facts,
          retrieved: retrieveWorkerKnowledge({
            intent: "unknown",
            facts: {
              ...input.facts,
              assignments: [],
              submissions: [],
              payments: [],
            },
          }),
          question: input.question,
          isFollowUp,
        },
        forceRuleOnly: true,
        latencyMs,
        denialReason: "Worker facts do not match the signed-in user",
      });
      recordWorkerCopilotTelemetry({
        success: true,
        latencyMs,
        confidence: 0,
        intent,
        aiAugmented: false,
      });
      return denial;
    }

    const retrieved = retrieveWorkerKnowledge({
      intent,
      facts: input.facts,
    });

    if (isWorkerMemoryEnabled()) {
      appendCopilotMemory(sessionId, {
        organizationId,
        actorUserId: input.actorUserId,
        message: { role: "user", content: input.question },
      });
      void readCopilotMemory(sessionId);
    }

    const latencyMs = Date.now() - started;
    const response = generateWorkerCopilotResponse({
      context: {
        facts: input.facts,
        retrieved,
        question: input.question,
        isFollowUp,
      },
      forceRuleOnly: input.forceRuleOnly,
      latencyMs,
    });

    if (isWorkerMemoryEnabled()) {
      lastIntentBySession.set(sessionId, intent);
      appendCopilotMemory(sessionId, {
        organizationId,
        actorUserId: input.actorUserId,
        message: { role: "assistant", content: response.answer },
      });
    }

    recordWorkerCopilotTelemetry({
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
    recordWorkerCopilotTelemetry({ success: false, latencyMs });
    throw error;
  }
}

export function resetWorkerCopilotSessionStateForTests(): void {
  lastIntentBySession.clear();
}

/**
 * Adapter for WorkerCopilot port.
 * Expects knowledgeSnapshot.facts + knowledgeSnapshot.auth.
 */
export const workerCopilot: WorkerCopilot = {
  async ask(
    query: CopilotQuery & { workerUserId: string },
  ): Promise<CopilotAnswer> {
    const snap = query.knowledgeSnapshot;
    const question =
      [...query.messages].reverse().find((m) => m.role === "user")?.content ??
      String(snap.question ?? "");

    const facts = snap.facts as WorkerKnowledgeFacts | undefined;
    const auth = snap.auth as WorkerCopilotAuthContext | undefined;

    if (!facts || !auth) {
      return {
        answer: "Missing worker facts or auth context.",
        citations: [],
        advisoryOnly: true,
      };
    }

    const response = await askWorkerCopilot({
      workerUserId: query.workerUserId,
      actorUserId: query.actorUserId,
      question,
      auth,
      facts,
      sessionOrganizationId: query.organizationId || undefined,
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

/** @deprecated Use workerCopilot */
export const workerCopilotStub = workerCopilot;
