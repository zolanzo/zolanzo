import { aiRuntimeMode, getAiProviderKey } from "@/lib/ai/config";
import type { EmbeddingProvider } from "@/lib/ai/types";
import { createMockEmbeddingProvider } from "@/lib/ai/embeddings/mock-embedding";
import { createOpenAiEmbeddingProvider } from "@/lib/ai/embeddings/openai-embedding";

export function getEmbeddingProvider(override?: {
  provider?: "mock" | "openai";
  apiKey?: string | null;
  fetchImpl?: typeof fetch;
}): EmbeddingProvider {
  if (aiRuntimeMode() === "disabled" && !override?.provider) {
    return createMockEmbeddingProvider();
  }
  const key = override?.provider ?? getAiProviderKey();
  if (key === "openai") {
    return createOpenAiEmbeddingProvider({
      apiKey: override?.apiKey,
      fetchImpl: override?.fetchImpl,
    });
  }
  return createMockEmbeddingProvider();
}

export type { EmbeddingProvider } from "@/lib/ai/types";
export { createMockEmbeddingProvider, createOpenAiEmbeddingProvider };
