/**
 * AI Engine invoke — prompt render → provider → parse → telemetry/audit.
 * Never writes domain state.
 */

import { createHash, randomUUID } from "crypto";
import { isAiEnabled } from "@/lib/ai/config";
import {
  getPrompt,
  renderPromptTemplate,
} from "@/lib/ai/prompts/registry";
import { parseStructuredJson } from "@/lib/ai/prompts/parser";
import { getIntelligenceLlmProvider } from "@/lib/ai/providers";
import type {
  AiInvokeRequest,
  AiInvokeResult,
  IntelligenceLlmProvider,
} from "@/lib/ai/types";
import { estimateCost } from "@/lib/ai/telemetry/accounting";
import {
  appendAiAudit,
  costFromEstimate,
  recordAiTelemetry,
} from "@/lib/ai/telemetry";
import { takeAiRateToken } from "@/lib/ai/engine/rate-limit";
import { withRetries } from "@/lib/ai/engine/resilience";

export type InvokeOptions = {
  provider?: IntelligenceLlmProvider;
  attempts?: number;
  rateLimitKey?: string;
};

function newCorrelationId(seed?: string | null): string {
  if (seed && seed.trim()) return seed.trim();
  return `aic-${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function invokeIntelligence(
  request: AiInvokeRequest,
  options: InvokeOptions = {},
): Promise<AiInvokeResult> {
  const correlationId = newCorrelationId(request.correlationId);
  const started = Date.now();
  const prompt = getPrompt(request.promptKey);

  if (!prompt && !request.userPrompt) {
    throw new Error(`Unknown prompt key: ${request.promptKey}`);
  }

  const systemPrompt =
    request.systemPrompt ??
    prompt?.system ??
    "You are a ZOLANZO advisory assistant. Reply with JSON only.";
  const userTemplate = request.userPrompt ?? prompt?.user ?? "";
  const userPrompt = renderPromptTemplate(
    userTemplate,
    request.variables ?? {},
  );

  const rateKey =
    options.rateLimitKey ??
    `ai:${request.organizationId ?? "global"}:${request.promptKey}`;
  if (!takeAiRateToken({ key: rateKey })) {
    const err = new Error("ai_rate_limited");
    recordFailure({
      correlationId,
      request,
      latencyMs: Date.now() - started,
      errorCode: "rate_limited",
    });
    throw err;
  }

  // Even when AI_ENABLED=false we allow mock health probes for admin UI
  const provider =
    options.provider ??
    getIntelligenceLlmProvider(
      isAiEnabled() ? undefined : { provider: "mock" },
    );

  try {
    const completion = await withRetries({
      attempts: options.attempts ?? 2,
      delayMs: 40,
      run: () =>
        provider.complete({
          systemPrompt,
          userPrompt,
          temperature: request.temperature,
          maxTokens: request.maxTokens,
          timeoutMs: request.timeoutMs ?? 20_000,
          correlationId,
        }),
      shouldRetry: (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        return msg.includes("timeout") || msg.includes("openai_http_5");
      },
    });

    const latencyMs = Date.now() - started;
    const cost = estimateCost(completion.model, completion.usage);
    const parsed = parseStructuredJson(completion.text);

    const result: AiInvokeResult = {
      provider: provider.providerKey,
      model: completion.model,
      rawText: completion.text,
      parsed,
      usage: completion.usage,
      cost,
      latencyMs,
      correlationId,
      stub: completion.stub,
    };

    recordAiTelemetry({
      at: new Date().toISOString(),
      kind: "invoke",
      provider: provider.providerKey,
      model: completion.model,
      latencyMs,
      success: true,
      correlationId,
      promptKey: request.promptKey,
      usageTotalTokens: completion.usage.totalTokens,
      costMicroUsd: costFromEstimate(cost),
    });

    appendAiAudit({
      at: new Date().toISOString(),
      correlationId,
      provider: provider.providerKey,
      promptKey: request.promptKey,
      organizationId: request.organizationId ?? null,
      actorUserId: request.actorUserId ?? null,
      success: true,
      latencyMs,
      totalTokens: completion.usage.totalTokens,
      costMicroUsd: costFromEstimate(cost),
      stub: completion.stub,
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - started;
    const errorCode =
      error instanceof Error ? error.message.slice(0, 120) : "unknown";
    recordFailure({ correlationId, request, latencyMs, errorCode });
    throw error;
  }
}

function recordFailure(params: {
  correlationId: string;
  request: AiInvokeRequest;
  latencyMs: number;
  errorCode: string;
}): void {
  recordAiTelemetry({
    at: new Date().toISOString(),
    kind: "error",
    provider: getIntelligenceLlmProvider().providerKey,
    model: "n/a",
    latencyMs: params.latencyMs,
    success: false,
    correlationId: params.correlationId,
    promptKey: params.request.promptKey,
    usageTotalTokens: 0,
    costMicroUsd: 0,
    errorCode: params.errorCode,
  });
  appendAiAudit({
    at: new Date().toISOString(),
    correlationId: params.correlationId,
    provider: "unknown",
    promptKey: params.request.promptKey,
    organizationId: params.request.organizationId ?? null,
    actorUserId: params.request.actorUserId ?? null,
    success: false,
    latencyMs: params.latencyMs,
    totalTokens: 0,
    costMicroUsd: 0,
    stub: true,
    errorCode: params.errorCode,
  });
}

/** Stable hash for frozen knowledge snapshots (debug / citations). */
export function hashSnapshot(data: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex")
    .slice(0, 16);
}
