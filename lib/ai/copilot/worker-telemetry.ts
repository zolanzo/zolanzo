/**
 * Worker Copilot telemetry — Admin health panel.
 */

import type {
  WorkerCopilotHealthCounters,
  WorkerCopilotIntent,
} from "@/lib/ai/copilot/worker-types";

const counters: WorkerCopilotHealthCounters = {
  requests: 0,
  failures: 0,
  totalLatencyMs: 0,
  totalConfidence: 0,
  answered: 0,
  aiAugmentCount: 0,
  ruleOnlyCount: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalCostMicroUsd: 0,
  lastLatencyMs: null,
  lastAt: null,
  intentCounts: {},
};

export function recordWorkerCopilotTelemetry(event: {
  success: boolean;
  latencyMs: number;
  confidence?: number;
  intent?: WorkerCopilotIntent;
  aiAugmented?: boolean;
  promptTokens?: number;
  completionTokens?: number;
  costMicroUsd?: number;
}): void {
  counters.requests += 1;
  if (!event.success) counters.failures += 1;
  counters.totalLatencyMs += event.latencyMs;
  counters.lastLatencyMs = event.latencyMs;
  counters.lastAt = new Date().toISOString();
  if (event.success) {
    counters.answered += 1;
    counters.totalConfidence += event.confidence ?? 0;
    if (event.aiAugmented) counters.aiAugmentCount += 1;
    else counters.ruleOnlyCount += 1;
    if (event.intent) {
      counters.intentCounts[event.intent] =
        (counters.intentCounts[event.intent] ?? 0) + 1;
    }
    counters.totalPromptTokens += event.promptTokens ?? 0;
    counters.totalCompletionTokens += event.completionTokens ?? 0;
    counters.totalCostMicroUsd += event.costMicroUsd ?? 0;
  }
}

export function getWorkerCopilotTelemetrySnapshot(): WorkerCopilotHealthCounters & {
  questionsToday: number;
  averageLatencyMs: number;
  averageConfidence: number;
  aiVsRuleRatio: number;
  errorRate: number;
  tokenUsage: number;
} {
  return {
    ...counters,
    intentCounts: { ...counters.intentCounts },
    questionsToday: counters.answered,
    averageLatencyMs:
      counters.requests > 0
        ? Math.round(counters.totalLatencyMs / counters.requests)
        : 0,
    averageConfidence:
      counters.answered > 0
        ? Math.round((counters.totalConfidence / counters.answered) * 100) /
          100
        : 0,
    aiVsRuleRatio:
      counters.answered > 0 ? counters.aiAugmentCount / counters.answered : 0,
    errorRate:
      counters.requests > 0 ? counters.failures / counters.requests : 0,
    tokenUsage: counters.totalPromptTokens + counters.totalCompletionTokens,
  };
}

export function resetWorkerCopilotTelemetryForTests(): void {
  counters.requests = 0;
  counters.failures = 0;
  counters.totalLatencyMs = 0;
  counters.totalConfidence = 0;
  counters.answered = 0;
  counters.aiAugmentCount = 0;
  counters.ruleOnlyCount = 0;
  counters.totalPromptTokens = 0;
  counters.totalCompletionTokens = 0;
  counters.totalCostMicroUsd = 0;
  counters.lastLatencyMs = null;
  counters.lastAt = null;
  counters.intentCounts = {};
}
