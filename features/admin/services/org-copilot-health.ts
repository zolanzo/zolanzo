/**
 * Admin Organization Copilot Health.
 */

import "server-only";

import {
  isOrgCopilotEnabled,
  isOrgMemoryEnabled,
  isOrgRecommendationsEnabled,
  shouldAugmentOrgCopilotWithAi,
  ORG_COPILOT_MODEL_VERSION,
} from "@/lib/ai/copilot/org-config";
import { getOrgCopilotTelemetrySnapshot } from "@/lib/ai/copilot/org-telemetry";
import { isAiEnabled } from "@/lib/ai/config";

export type OrgCopilotHealthSnapshot = {
  orgCopilotEnabled: boolean;
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

export async function getOrgCopilotHealthSnapshot(): Promise<OrgCopilotHealthSnapshot> {
  const telemetry = getOrgCopilotTelemetrySnapshot();
  return {
    orgCopilotEnabled: isOrgCopilotEnabled(),
    memoryEnabled: isOrgMemoryEnabled(),
    recommendationsEnabled: isOrgRecommendationsEnabled(),
    aiEnabled: isAiEnabled(),
    aiAugmentEnabled: shouldAugmentOrgCopilotWithAi(),
    modelVersion: ORG_COPILOT_MODEL_VERSION,
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
