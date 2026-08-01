/**
 * Mock LLM provider — deterministic JSON for local / tests / AI_ENABLED=false paths.
 */

import type { IntelligenceLlmProvider } from "@/lib/ai/types";
import { estimateTokensFromText } from "@/lib/ai/telemetry/accounting";

export function createMockAiProvider(): IntelligenceLlmProvider {
  return {
    providerKey: "mock",
    async complete(params) {
      const promptTokens = estimateTokensFromText(
        params.systemPrompt + params.userPrompt,
      );
      const body = {
        ok: true,
        message: "mock",
        provider: "mock",
        advisoryOnly: true,
        echo: params.userPrompt.slice(0, 200),
      };
      const text = JSON.stringify(body);
      const completionTokens = estimateTokensFromText(text);
      return {
        text,
        model: "mock",
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        stub: true,
      };
    },
  };
}

export const mockAiProvider = createMockAiProvider();
