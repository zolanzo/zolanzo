/**
 * OpenAI LLM adapter — HTTP only, no SDK.
 * Live when AI_ENABLED + AI_PROVIDER=openai + OPENAI_API_KEY.
 * Otherwise behaves as stub (never throws on missing key at construct time).
 */

import {
  getOpenAiApiKey,
  getOpenAiModel,
  shouldUseLiveOpenAi,
} from "@/lib/ai/config";
import type { IntelligenceLlmProvider, AiTokenUsage } from "@/lib/ai/types";
import {
  estimateTokensFromText,
} from "@/lib/ai/telemetry/accounting";
import { withTimeout } from "@/lib/ai/engine/resilience";
import { createMockAiProvider } from "@/lib/ai/providers/mock-provider";

type OpenAiChatResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export function createOpenAiProvider(options?: {
  apiKey?: string | null;
  model?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}): IntelligenceLlmProvider {
  const apiKey = options?.apiKey ?? getOpenAiApiKey();
  const model = options?.model ?? getOpenAiModel();
  const baseUrl = options?.baseUrl ?? "https://api.openai.com/v1";
  const fetchImpl = options?.fetchImpl ?? fetch;
  const live = Boolean(apiKey) && (options?.apiKey !== undefined || shouldUseLiveOpenAi());

  if (!live || !apiKey) {
    const mock = createMockAiProvider();
    return {
      providerKey: "openai",
      async complete(params) {
        const result = await mock.complete(params);
        return {
          ...result,
          model: `${model}-stub`,
          stub: true,
        };
      },
    };
  }

  return {
    providerKey: "openai",
    async complete(params) {
      const timeoutMs = params.timeoutMs ?? 20_000;
      const payload = {
        model,
        temperature: params.temperature ?? 0.2,
        max_tokens: params.maxTokens ?? 1024,
        response_format: { type: "json_object" as const },
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
      };

      const response = await withTimeout(
        fetchImpl(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...(params.correlationId
              ? { "X-Correlation-Id": params.correlationId }
              : {}),
          },
          body: JSON.stringify(payload),
        }),
        timeoutMs,
        "openai_timeout",
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(
          `openai_http_${response.status}:${errText.slice(0, 200)}`,
        );
      }

      const data = (await response.json()) as OpenAiChatResponse;
      const text = data.choices?.[0]?.message?.content?.trim() || "{}";
      const usage: AiTokenUsage = {
        promptTokens: data.usage?.prompt_tokens ?? estimateTokensFromText(
          params.systemPrompt + params.userPrompt,
        ),
        completionTokens:
          data.usage?.completion_tokens ?? estimateTokensFromText(text),
        totalTokens:
          data.usage?.total_tokens ??
          estimateTokensFromText(params.systemPrompt + params.userPrompt + text),
      };

      return {
        text,
        model: data.model ?? model,
        usage,
        stub: false,
      };
    },
  };
}

export const openAiProvider = createOpenAiProvider();
