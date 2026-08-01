/**
 * Mock embedding provider.
 */

import type { EmbeddingProvider } from "@/lib/ai/types";
import { estimateTokensFromText } from "@/lib/ai/telemetry/accounting";

function pseudoVector(text: string, dims = 8): number[] {
  const out = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    out[i % dims]! += (text.charCodeAt(i) % 31) / 31;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}

export function createMockEmbeddingProvider(): EmbeddingProvider {
  return {
    providerKey: "mock",
    async embed(params) {
      const joined = params.input.join(" ");
      const promptTokens = estimateTokensFromText(joined);
      return {
        vectors: params.input.map((t) => pseudoVector(t)),
        model: params.model ?? "mock-embed",
        usage: {
          promptTokens,
          completionTokens: 0,
          totalTokens: promptTokens,
        },
        stub: true,
      };
    },
  };
}

export const mockEmbeddingProvider = createMockEmbeddingProvider();
