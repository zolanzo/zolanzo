/**
 * Admin AI Health — provider, latency, requests, failures, token cost.
 */

import "server-only";

import {
  aiRuntimeMode,
  getAiProviderKey,
  getOpenAiApiKey,
  getOpenAiModel,
  isAiEnabled,
} from "@/lib/ai/config";
import { listPromptKeys } from "@/lib/ai/prompts/registry";
import {
  getAiTelemetrySnapshot,
  listAiAudit,
} from "@/lib/ai/telemetry";
import { invokeIntelligence } from "@/lib/ai/engine";

export type AiHealthSnapshot = {
  enabled: boolean;
  runtimeMode: "disabled" | "mock" | "live";
  provider: string;
  model: string;
  keysConfigured: boolean;
  requests: number;
  failures: number;
  avgLatencyMs: number;
  lastLatencyMs: number | null;
  estimatedTokenCostMicroUsd: number;
  totalTokens: number;
  promptKeys: string[];
  recentAudit: Array<{
    at: string;
    promptKey: string;
    success: boolean;
    latencyMs: number;
    totalTokens: number;
    costMicroUsd: number;
    stub: boolean;
  }>;
  probe: {
    ok: boolean;
    latencyMs: number | null;
    stub: boolean;
    correlationId: string | null;
    error: string | null;
  };
  generatedAt: string;
};

export async function getAiHealthSnapshot(options?: {
  runProbe?: boolean;
}): Promise<AiHealthSnapshot> {
  const _telemetry = getAiTelemetrySnapshot();
  const audit = listAiAudit(8);

  let probe: AiHealthSnapshot["probe"] = {
    ok: false,
    latencyMs: null,
    stub: true,
    correlationId: null,
    error: null,
  };

  if (options?.runProbe !== false) {
    try {
      const result = await invokeIntelligence({
        promptKey: "health.ping",
        variables: { provider: getAiProviderKey() },
        correlationId: null,
        metadata: { source: "ai_health" },
      });
      probe = {
        ok: true,
        latencyMs: result.latencyMs,
        stub: result.stub,
        correlationId: result.correlationId,
        error: null,
      };
    } catch (error) {
      probe = {
        ok: false,
        latencyMs: null,
        stub: true,
        correlationId: null,
        error: error instanceof Error ? error.message : "probe_failed",
      };
    }
  }

  const refreshed = getAiTelemetrySnapshot();

  return {
    enabled: isAiEnabled(),
    runtimeMode: aiRuntimeMode(),
    provider: getAiProviderKey(),
    model: getOpenAiModel(),
    keysConfigured: Boolean(getOpenAiApiKey()),
    requests: refreshed.totals.requests,
    failures: refreshed.totals.failures,
    avgLatencyMs: refreshed.totals.avgLatencyMs,
    lastLatencyMs: refreshed.totals.lastLatencyMs,
    estimatedTokenCostMicroUsd: refreshed.totals.totalCostMicroUsd,
    totalTokens: refreshed.totals.totalTokens,
    promptKeys: listPromptKeys(),
    recentAudit: audit.map((a) => ({
      at: a.at,
      promptKey: a.promptKey,
      success: a.success,
      latencyMs: a.latencyMs,
      totalTokens: a.totalTokens,
      costMicroUsd: a.costMicroUsd,
      stub: a.stub,
    })),
    probe,
    generatedAt: new Date().toISOString(),
  };
}

/** Alias kept for Command Center naming consistency */
export const getAIHealthSnapshot = getAiHealthSnapshot;
