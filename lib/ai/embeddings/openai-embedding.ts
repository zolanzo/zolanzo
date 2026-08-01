/**
 * OpenAI embeddings adapter — HTTP only.
 */

import {
  getOpenAiApiKey,
  getOpenAiEmbeddingModel,
  shouldUseLiveOpenAi,
} from "@/lib/ai/config";
import type { EmbeddingProvider, AiTokenUsage } from "@/lib/ai/types";
import { estimateTokensFromText } from "@/lib/ai/telemetry/accounting";
import { withTimeout } from "@/lib/ai/engine/resilience";
import { createMockEmbeddingProvider } from "@/lib/ai/embeddings/mock-embedding";

type OpenAiEmbedResponse = {
  model?: string;
  data?: Array<{ embedding?: number[] }>;
  usage?: { prompt_tokens?: number; total_tokens?: number };
};

export function createOpenAiEmbeddingProvider(options?: {
  apiKey?: string | null;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): EmbeddingProvider {
  const apiKey = options?.apiKey ?? getOpenAiApiKey();
  const model = options?.model ?? getOpenAiEmbeddingModel();
  const baseUrl = options?.baseUrl ?? "https://api.openai.com/v1";
  const fetchImpl = options?.fetchImpl ?? fetch;
  const live =
    Boolean(apiKey) &&
    (options?.apiKey !== undefined || shouldUseLiveOpenAi());

  if (!live || !apiKey) {
    const mock = createMockEmbeddingProvider();
    return {
      providerKey: "openai",
      async embed(params) {
        const result = await mock.embed(params);
        return { ...result, model: `${model}-stub`, stub: true };
      },
    };
  }

  return {
    providerKey: "openai",
    async embed(params) {
      const timeoutMs = params.timeoutMs ?? 20_000;
      const response = await withTimeout(
        fetchImpl(`${baseUrl}/embeddings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(params.correlationId
              ? { "X-Correlation-Id": params.correlationId }
              : {}),
          },
          body: JSON.stringify({
            model: params.model ?? model,
            input: params.input,
          }),
        }),
        timeoutMs,
        "openai_embed_timeout",
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `openai_embed_http_${response.status}:${errText.slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as OpenAiEmbedResponse;
      const vectors =
        data.data?.map((d) => d.embedding ?? []) ??
        params.input.map(() => []);
      const usage: AiTokenUsage = {
        promptTokens:
          data.usage?.prompt_tokens ??
          estimateTokensFromText(params.input.join(" ")),
        completionTokens: 0,
        totalTokens:
          data.usage?.total_tokens ??
          estimateTokensFromText(params.input.join(" ")),
      };

      return {
        vectors,
        model: data.model ?? model,
        usage,
        stub: false,
      };
    },
  };
}

export const openAiEmbeddingProvider = createOpenAiEmbeddingProvider();
