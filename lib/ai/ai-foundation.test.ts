/**
 * Phase 4.1A — AI Intelligence Foundation tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMockAiProvider,
  createOpenAiProvider,
  getIntelligenceLlmProvider,
} from "@/lib/ai/providers";
import { invokeIntelligence } from "@/lib/ai/engine";
import { parseStructuredJson } from "@/lib/ai/prompts/parser";
import { getPrompt, renderPromptTemplate } from "@/lib/ai/prompts/registry";
import {
  isAiEnabled,
  getAiProviderKey,
  aiRuntimeMode,
} from "@/lib/ai/config";
import {
  resetAiAuditForTests,
  resetAiTelemetryForTests,
  getAiTelemetrySnapshot,
  listAiAudit,
} from "@/lib/ai/telemetry";
import {
  resetAiRateLimiterForTests,
  withRetries,
  withTimeout,
} from "@/lib/ai/engine";
import { reviewAssistant } from "@/lib/ai/review";
import {
  organizationCopilot,
  workerCopilotStub,
} from "@/lib/ai/copilot";
import { fraudDetector } from "@/lib/ai/fraud";
import type { OrgKnowledgeFacts } from "@/lib/ai/copilot/org-types";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetAiTelemetryForTests();
  resetAiAuditForTests();
  resetAiRateLimiterForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AI_ENABLED;
  delete process.env.AI_PROVIDER;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("AI feature flags / config", () => {
  it("defaults AI to disabled", () => {
    expect(isAiEnabled()).toBe(false);
    expect(aiRuntimeMode()).toBe("disabled");
    expect(getAiProviderKey()).toBe("mock");
  });

  it("enables mock mode when AI_ENABLED without openai key", () => {
    process.env.AI_ENABLED = "1";
    process.env.AI_PROVIDER = "mock";
    expect(isAiEnabled()).toBe(true);
    expect(aiRuntimeMode()).toBe("mock");
  });

  it("selects live only with openai + key + enabled", () => {
    process.env.AI_ENABLED = "true";
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(aiRuntimeMode()).toBe("live");
  });
});

describe("prompt registry + parser", () => {
  it("renders variables", () => {
    expect(renderPromptTemplate("Hello {{name}}", { name: "Chiagozie" })).toBe(
      "Hello Chiagozie",
    );
  });

  it("loads health.ping prompt", () => {
    expect(getPrompt("health.ping")?.key).toBe("health.ping");
  });

  it("parses fenced JSON", () => {
    expect(parseStructuredJson('```json\n{"ok":true}\n```')).toEqual({
      ok: true,
    });
  });

  it("parses embedded JSON object", () => {
    expect(parseStructuredJson('prefix {"a":1} suffix')).toEqual({ a: 1 });
  });
});

describe("providers", () => {
  it("mock provider returns stub JSON", async () => {
    const provider = createMockAiProvider();
    const result = await provider.complete({
      systemPrompt: "sys",
      userPrompt: "hello",
    });
    expect(result.stub).toBe(true);
    expect(provider.providerKey).toBe("mock");
    expect(JSON.parse(result.text).ok).toBe(true);
  });

  it("openai adapter stubs without key", async () => {
    const provider = createOpenAiProvider({ apiKey: null });
    const result = await provider.complete({
      systemPrompt: "sys",
      userPrompt: "ping",
    });
    expect(result.stub).toBe(true);
    expect(provider.providerKey).toBe("openai");
  });

  it("openai adapter calls fetch when key provided", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          model: "gpt-4o-mini",
          choices: [{ message: { content: '{"ok":true,"provider":"openai"}' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
        { status: 200 },
      );
    });

    const provider = createOpenAiProvider({
      apiKey: "sk-test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await provider.complete({
      systemPrompt: "sys",
      userPrompt: "ping",
      correlationId: "aic-test",
    });
    expect(result.stub).toBe(false);
    expect(result.usage.totalTokens).toBe(15);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const init = call[1];
    expect((init.headers as Record<string, string>)["X-Correlation-Id"]).toBe(
      "aic-test",
    );
  });

  it("switches provider via getIntelligenceLlmProvider", () => {
    expect(getIntelligenceLlmProvider({ provider: "mock" }).providerKey).toBe(
      "mock",
    );
    expect(
      getIntelligenceLlmProvider({ provider: "openai", apiKey: null })
        .providerKey,
    ).toBe("openai");
  });
});

describe("engine invoke", () => {
  it("invokes mock with audit + telemetry", async () => {
    const result = await invokeIntelligence({
      promptKey: "health.ping",
      variables: { provider: "mock" },
      organizationId: "org_1",
      actorUserId: "user_1",
    });
    expect(result.parsed?.ok).toBe(true);
    expect(result.correlationId).toMatch(/^aic-/);
    expect(getAiTelemetrySnapshot().totals.requests).toBeGreaterThanOrEqual(1);
    expect(listAiAudit(5)[0]?.promptKey).toBe("health.ping");
  });

  it("retries on timeout-like failures then succeeds", async () => {
    let attempts = 0;
    const provider = createMockAiProvider();
    const flaky: typeof provider = {
      providerKey: "mock",
      async complete(params) {
        attempts += 1;
        if (attempts < 2) throw new Error("openai_timeout:1ms");
        return provider.complete(params);
      },
    };
    const result = await invokeIntelligence(
      { promptKey: "health.ping", variables: { provider: "mock" } },
      { provider: flaky, attempts: 3 },
    );
    expect(result.parsed?.ok).toBe(true);
    expect(attempts).toBe(2);
  });
});

describe("timeouts + retries helpers", () => {
  it("withTimeout rejects after deadline", async () => {
    await expect(
      withTimeout(new Promise(() => undefined), 20, "test_timeout"),
    ).rejects.toThrow(/test_timeout/);
  });

  it("withRetries eventually throws", async () => {
    await expect(
      withRetries({
        attempts: 2,
        delayMs: 1,
        run: async () => {
          throw new Error("always");
        },
      }),
    ).rejects.toThrow("always");
  });
});

describe("capability ports", () => {
  it("fraud detector returns advisory assessment", async () => {
    const result = await fraudDetector.assess({
      submissionId: "sub_1",
      organizationId: "org_1",
      knowledgeSnapshot: {
        workerUserId: "w1",
        emailVerified: true,
        phoneVerified: true,
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "photo",
            contentHash: "abc",
            sizeBytes: 50_000,
            replacedAt: null,
          },
        ],
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
  });

  it("review assistant returns advisory recommendation", async () => {
    const result = await reviewAssistant.assist({
      submissionId: "sub_1",
      knowledgeSnapshot: {
        workerUserId: "w1",
        identityVerified: true,
        gpsPresent: true,
        gpsWithinBoundary: true,
        fraudRiskScore: 10,
        fraudRiskLevel: "low",
        requiredEvidenceKinds: ["image"],
        evidenceItems: [
          {
            id: "e1",
            kind: "image",
            label: "photo",
            contentHash: "abc",
            sizeBytes: 50_000,
            replacedAt: null,
          },
        ],
        workerApprovalRate: 0.9,
        workerCompletedTasks: 8,
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.recommendation).toBe("approve");
  });

  it("organization copilot returns advisory answer", async () => {
    const facts: OrgKnowledgeFacts = {
      organizationId: "org_1",
      organizationName: "Test Org",
      currency: "NGN",
      frozenAt: new Date().toISOString(),
      spendingThisQuarterMinor: 0,
      campaigns: [],
      workers: [
        {
          userId: "w1",
          displayName: "Ada",
          completedTasks: 10,
          approvalRate: 0.9,
          activeAssignments: 0,
          lastActivityAt: new Date().toISOString(),
          trustScore: 88,
          trustTrend: "stable",
          reliabilityScore: 90,
        },
      ],
      reviewers: [],
      payments: [],
      fraudTrends: [],
    };
    const result = await organizationCopilot.ask({
      organizationId: "org_1",
      actorUserId: "u1",
      messages: [
        { role: "user", content: "Who are my top-performing workers this month?" },
      ],
      knowledgeSnapshot: {
        facts,
        auth: {
          organizationId: "org_1",
          actorUserId: "u1",
          isOrgMember: true,
          permissions: ["campaigns.read"],
        },
        forceRuleOnly: true,
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.answer.length).toBeGreaterThan(0);
  });

  it("worker copilot answers advisory-only", async () => {
    const result = await workerCopilotStub.ask({
      organizationId: "worker:u",
      actorUserId: "u",
      workerUserId: "u",
      messages: [{ role: "user", content: "What should I do next?" }],
      knowledgeSnapshot: {
        forceRuleOnly: true,
        facts: {
          workerUserId: "u",
          displayName: "Test",
          trustScore: 50,
          approvalRate: 0.7,
          completedAssignments: 0,
          earningsThisWeekMinor: 0,
          currency: "NGN",
          avgReviewHours: null,
          avgPaymentHours: null,
          assignments: [],
          submissions: [],
          payments: [],
          workerCountryCode: null,
          emailVerified: false,
          phoneVerified: false,
          trustTrend: null,
          trustReasons: [],
          trustWarnings: [],
          trustLastEvents: [],
          frozenAt: new Date().toISOString(),
        },
        auth: {
          actorUserId: "u",
          workerUserId: "u",
          permissions: ["assignments.read"],
        },
      },
    });
    expect(result.advisoryOnly).toBe(true);
    expect(result.answer.length).toBeGreaterThan(0);
  });
});
