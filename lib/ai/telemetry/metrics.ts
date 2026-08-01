/**
 * In-process AI telemetry — requests, failures, latency, cost.
 */

import type { AiCostEstimate, AiLlmProviderKey } from "@/lib/ai/types";

export type AiTelemetryEvent = {
  at: string;
  kind: "invoke" | "embed" | "error";
  provider: AiLlmProviderKey;
  model: string;
  latencyMs: number;
  success: boolean;
  correlationId: string | null;
  promptKey?: string;
  usageTotalTokens: number;
  costMicroUsd: number;
  errorCode?: string;
};

type Aggregate = {
  requests: number;
  failures: number;
  totalLatencyMs: number;
  totalTokens: number;
  totalCostMicroUsd: number;
  lastLatencyMs: number | null;
  lastError: string | null;
  lastAt: string | null;
};

const recent: AiTelemetryEvent[] = [];
const MAX_RECENT = 200;
const byProvider: Record<string, Aggregate> = {};

function ensureAgg(provider: string): Aggregate {
  if (!byProvider[provider]) {
    byProvider[provider] = {
      requests: 0,
      failures: 0,
      totalLatencyMs: 0,
      totalTokens: 0,
      totalCostMicroUsd: 0,
      lastLatencyMs: null,
      lastError: null,
      lastAt: null,
    };
  }
  return byProvider[provider]!;
}

export function recordAiTelemetry(event: AiTelemetryEvent): void {
  recent.push(event);
  if (recent.length > MAX_RECENT) recent.shift();
  const agg = ensureAgg(event.provider);
  agg.requests += 1;
  if (!event.success) {
    agg.failures += 1;
    agg.lastError = event.errorCode ?? "error";
  }
  agg.totalLatencyMs += event.latencyMs;
  agg.totalTokens += event.usageTotalTokens;
  agg.totalCostMicroUsd += event.costMicroUsd;
  agg.lastLatencyMs = event.latencyMs;
  agg.lastAt = event.at;
}

export function getAiTelemetrySnapshot(): {
  recent: AiTelemetryEvent[];
  byProvider: Record<string, Aggregate & { avgLatencyMs: number }>;
  totals: Aggregate & { avgLatencyMs: number };
} {
  const mapped: Record<string, Aggregate & { avgLatencyMs: number }> = {};
  let totals: Aggregate = {
    requests: 0,
    failures: 0,
    totalLatencyMs: 0,
    totalTokens: 0,
    totalCostMicroUsd: 0,
    lastLatencyMs: null,
    lastError: null,
    lastAt: null,
  };

  for (const [key, agg] of Object.entries(byProvider)) {
    mapped[key] = {
      ...agg,
      avgLatencyMs:
        agg.requests > 0 ? Math.round(agg.totalLatencyMs / agg.requests) : 0,
    };
    totals = {
      requests: totals.requests + agg.requests,
      failures: totals.failures + agg.failures,
      totalLatencyMs: totals.totalLatencyMs + agg.totalLatencyMs,
      totalTokens: totals.totalTokens + agg.totalTokens,
      totalCostMicroUsd: totals.totalCostMicroUsd + agg.totalCostMicroUsd,
      lastLatencyMs: agg.lastLatencyMs ?? totals.lastLatencyMs,
      lastError: agg.lastError ?? totals.lastError,
      lastAt: agg.lastAt ?? totals.lastAt,
    };
  }

  return {
    recent: [...recent].reverse(),
    byProvider: mapped,
    totals: {
      ...totals,
      avgLatencyMs:
        totals.requests > 0
          ? Math.round(totals.totalLatencyMs / totals.requests)
          : 0,
    },
  };
}

/** Test helper */
export function resetAiTelemetryForTests(): void {
  recent.length = 0;
  for (const key of Object.keys(byProvider)) {
    delete byProvider[key];
  }
}

export function costFromEstimate(cost: AiCostEstimate): number {
  return cost.estimatedMicroUsd;
}
