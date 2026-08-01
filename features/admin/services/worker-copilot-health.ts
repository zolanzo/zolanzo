/**
 * Admin Worker Copilot Health.
 */

import "server-only";

import {
  isWorkerCopilotEnabled,
  isWorkerMemoryEnabled,
  isWorkerRecommendationsEnabled,
  shouldAugmentWorkerCopilotWithAi,
  WORKER_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/worker-config";
import { getWorkerCopilotTelemetrySnapshot } from "@/lib/ai/copilot/worker-telemetry";
import { isAiEnabled } from "@/lib/ai/config";

export type WorkerCopilotHealthSnapshot = {
  workerCopilotEnabled: boolean;
  memoryEnabled: boolean;
  recommendationsEnabled: boolean;
  aiEnabled: boolean;
  aiAugmentEnabled: boolean;
  modelVersion: string;
  questionsToday: number;
  averageLatencyMs: number;
  averageConfidence: number;
  lastLatencyMs: number | null;
  aiAugmentedCount: number;
  ruleOnlyCount: number;
  aiVsRuleRatio: number;
  tokenUsage: number;
  estimatedCostMicroUsd: number;
  errorRate: number;
  failures: number;
  requests: number;
  intentDistribution: Record<string, number>;
  generatedAt: string;
};

export async function getWorkerCopilotHealthSnapshot(): Promise<WorkerCopilotHealthSnapshot> {
  const telemetry = getWorkerCopilotTelemetrySnapshot();
  return {
    workerCopilotEnabled: isWorkerCopilotEnabled(),
    memoryEnabled: isWorkerMemoryEnabled(),
    recommendationsEnabled: isWorkerRecommendationsEnabled(),
    aiEnabled: isAiEnabled(),
    aiAugmentEnabled: shouldAugmentWorkerCopilotWithAi(),
    modelVersion: WORKER_COPILOT_MODEL_VERSION,
    questionsToday: telemetry.questionsToday,
    averageLatencyMs: telemetry.averageLatencyMs,
    averageConfidence: telemetry.averageConfidence,
    lastLatencyMs: telemetry.lastLatencyMs,
    aiAugmentedCount: telemetry.aiAugmentCount,
    ruleOnlyCount: telemetry.ruleOnlyCount,
    aiVsRuleRatio: telemetry.aiVsRuleRatio,
    tokenUsage: telemetry.tokenUsage,
    estimatedCostMicroUsd: telemetry.totalCostMicroUsd,
    errorRate: telemetry.errorRate,
    failures: telemetry.failures,
    requests: telemetry.requests,
    intentDistribution: telemetry.intentCounts as Record<string, number>,
    generatedAt: new Date().toISOString(),
  };
}
