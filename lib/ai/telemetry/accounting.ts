/**
 * Token / cost accounting helpers (estimates — not billing ledger).
 */

import type { AiCostEstimate, AiTokenUsage } from "@/lib/ai/types";

/** Rough USD per 1M tokens — estimates only for ops dashboards. */
const MODEL_RATES: Record<
  string,
  { inputPerM: number; outputPerM: number }
> = {
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.6 },
  "gpt-4o": { inputPerM: 2.5, outputPerM: 10 },
  "text-embedding-3-small": { inputPerM: 0.02, outputPerM: 0 },
  mock: { inputPerM: 0, outputPerM: 0 },
};

export function emptyUsage(): AiTokenUsage {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

export function estimateCost(
  model: string,
  usage: AiTokenUsage,
): AiCostEstimate {
  const rates = MODEL_RATES[model] ?? MODEL_RATES["gpt-4o-mini"]!;
  const usd =
    (usage.promptTokens / 1_000_000) * rates.inputPerM +
    (usage.completionTokens / 1_000_000) * rates.outputPerM;
  return {
    currency: "USD",
    estimatedMicroUsd: Math.round(usd * 1_000_000),
    model,
  };
}

export function estimateTokensFromText(text: string): number {
  // ~4 chars/token heuristic
  return Math.max(1, Math.ceil(text.length / 4));
}
