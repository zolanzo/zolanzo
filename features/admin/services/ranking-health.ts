/**
 * Admin Ranking Health — Match Engine observability.
 */

import "server-only";

import {
  isMatchEngineEnabled,
  isMatchExplainabilityEnabled,
  isMatchFairnessEnabled,
  shouldAugmentWithAiConfidence,
  MATCH_ENGINE_MODEL_VERSION,
} from "@/lib/ai/ranking/match-config";
import { getRankingTelemetrySnapshot } from "@/lib/ai/ranking/ranking-telemetry";
import { isAiEnabled } from "@/lib/ai/config";

export type RankingHealthSnapshot = {
  matchEngineEnabled: boolean;
  explainabilityEnabled: boolean;
  fairnessEnabled: boolean;
  aiEnabled: boolean;
  aiAugmentEnabled: boolean;
  modelVersion: string;
  requests: number;
  failures: number;
  averageScore: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  fallbackUsage: number;
  fallbackRate: number;
  aiAugmentCount: number;
  scoredWorkers: number;
  generatedAt: string;
};

export async function getRankingHealthSnapshot(): Promise<RankingHealthSnapshot> {
  const telemetry = getRankingTelemetrySnapshot();
  return {
    matchEngineEnabled: isMatchEngineEnabled(),
    explainabilityEnabled: isMatchExplainabilityEnabled(),
    fairnessEnabled: isMatchFairnessEnabled(),
    aiEnabled: isAiEnabled(),
    aiAugmentEnabled: shouldAugmentWithAiConfidence(),
    modelVersion: MATCH_ENGINE_MODEL_VERSION,
    requests: telemetry.requests,
    failures: telemetry.failures,
    averageScore: telemetry.averageScore,
    averageLatencyMs: telemetry.averageLatencyMs,
    lastLatencyMs: telemetry.lastLatencyMs,
    fallbackUsage: telemetry.fallbackCount,
    fallbackRate: telemetry.fallbackRate,
    aiAugmentCount: telemetry.aiAugmentCount,
    scoredWorkers: telemetry.scoredWorkers,
    generatedAt: new Date().toISOString(),
  };
}
