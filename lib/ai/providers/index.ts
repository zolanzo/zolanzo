/**
 * Select Intelligence LLM provider from env / overrides.
 */

import { aiRuntimeMode, getAiProviderKey } from "@/lib/ai/config";
import type { IntelligenceLlmProvider } from "@/lib/ai/types";
import { createMockAiProvider } from "@/lib/ai/providers/mock-provider";
import { createOpenAiProvider } from "@/lib/ai/providers/openai-provider";

export function getIntelligenceLlmProvider(override?: {
  provider?: "mock" | "openai";
  apiKey?: string | null;
  fetchImpl?: typeof fetch;
}): IntelligenceLlmProvider {
  if (aiRuntimeMode() === "disabled" && !override?.provider) {
    return createMockAiProvider();
  }

  const key = override?.provider ?? getAiProviderKey();
  if (key === "openai") {
    return createOpenAiProvider({
      apiKey: override?.apiKey,
      fetchImpl: override?.fetchImpl,
    });
  }
  return createMockAiProvider();
}

export { createMockAiProvider, createOpenAiProvider };
