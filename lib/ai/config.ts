/**
 * AI Intelligence runtime config — env + feature gates.
 * Live providers activate only when AI_ENABLED and keys are set.
 */

import type { AiLlmProviderKey } from "@/lib/ai/types";

export function isAiEnabled(): boolean {
  const raw = process.env.AI_ENABLED?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  // Default off for RC safety — opt-in
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

export function getAiProviderKey(): AiLlmProviderKey {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "openai") return "openai";
  return "mock";
}

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

export function getOpenAiEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
}

export function shouldUseLiveOpenAi(): boolean {
  return (
    isAiEnabled() &&
    getAiProviderKey() === "openai" &&
    getOpenAiApiKey() !== null
  );
}

export function aiRuntimeMode(): "disabled" | "mock" | "live" {
  if (!isAiEnabled()) return "disabled";
  if (shouldUseLiveOpenAi()) return "live";
  return "mock";
}
