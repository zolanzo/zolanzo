import { describe, expect, it } from "vitest";
import {
  listAiPlugins,
  selectAiPlugin,
  memoryAiPlugin,
  evidenceQualityPlugin,
  fraudDetectionPlugin,
} from "@/lib/integrations/ai";
import {
  pluginHasCapabilities,
  pluginSupports,
} from "@/lib/integrations/ai/stub-factory";
import { buildAiContext } from "@/features/ai-platform/services/context";
import {
  configurationSubjectKey,
  evaluateAiPolicy,
} from "@/features/ai-platform/services/policies";
import { formatRandomPublicId, isValidPublicId } from "@/lib/public-id/format";
import { AI_EXTENSION_POINTS, AI_PLUGIN_CAPABILITIES } from "@/constants/ai";

describe("AI plugin registry", () => {
  it("lists builtin plugins including stubs and memory", () => {
    const keys = listAiPlugins().map((p) => p.metadata.key);
    expect(keys).toContain("memory");
    expect(keys).toContain("evidence_quality");
    expect(keys).toContain("fraud_detection");
    expect(keys).toContain("duplicate_detection");
    expect(keys).toContain("risk_scoring");
    expect(keys).toContain("reviewer_assistance");
    expect(keys).toContain("queue_routing");
    expect(keys).toContain("moderation_assistance");
    expect(keys).toContain("translation_assistance");
    expect(keys).toContain("prompt_generation");
  });

  it("selects by capability without naming a model", () => {
    const plugin = selectAiPlugin({
      requiredCapabilities: ["reviewer_assistance"],
      extensionPoint: "review",
      entityType: "review_queue_item",
    });
    expect(plugin.metadata.capabilities).toContain("reviewer_assistance");
  });

  it("prefers memory when preferLive", () => {
    const plugin = selectAiPlugin({
      requiredCapabilities: ["evidence_quality"],
      preferLive: true,
    });
    expect(plugin.metadata.key).toBe("memory");
  });

  it("reports capability membership", () => {
    expect(
      pluginHasCapabilities(evidenceQualityPlugin, ["evidence_quality"]),
    ).toBe(true);
    expect(pluginHasCapabilities(fraudDetectionPlugin, ["risk_scoring"])).toBe(
      false,
    );
    expect(
      pluginSupports(evidenceQualityPlugin, {
        extensionPoint: "validation",
        entityType: "submission",
      }),
    ).toBe(true);
  });
});

describe("AI context snapshots", () => {
  it("builds immutable context", () => {
    const ctx = buildAiContext({
      extensionPoint: "review",
      entityType: "submission",
      entityId: "sub_1",
      entityPublicId: "SUB-6P2RM8",
      evidenceSnapshot: { items: [{ id: "e1" }] },
      promptVariables: { seedScore: "0.8" },
    });
    expect(ctx.entityPublicId).toBe("SUB-6P2RM8");
    expect(ctx.evidenceSnapshot).toEqual({ items: [{ id: "e1" }] });
    expect(() => {
      (ctx as { entityId: string }).entityId = "mutated";
    }).toThrow();
  });
});

describe("plugin execution", () => {
  it("memory plugin returns structured result", async () => {
    const ctx = buildAiContext({
      extensionPoint: "validation",
      entityType: "submission",
      entityId: "sub_1",
      entityPublicId: "SUB-6P2RM8",
      evidenceSnapshot: { items: [{ id: "e1" }, { id: "e2" }] },
    });
    const result = await memoryAiPlugin.execute(ctx);
    expect(result.pluginKey).toBe("memory");
    expect(result.recommendation).toBe("assist");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.model).toBe("memory-heuristic");
  });

  it("stub plugins return noop without live models", async () => {
    const ctx = buildAiContext({
      extensionPoint: "validation",
      entityType: "submission",
      entityId: "sub_1",
    });
    const result = await evidenceQualityPlugin.execute(ctx);
    expect(result.recommendation).toBe("noop");
    expect(result.metadata.stub).toBe(true);
    expect(result.findings[0]?.code).toBe("STUB_ONLY");
  });
});

describe("AI policies", () => {
  it("enforces disabled and recommendation modes", () => {
    expect(evaluateAiPolicy("disabled").executePlugin).toBe(false);
    expect(evaluateAiPolicy("recommendation_only").applyAutomatically).toBe(
      false,
    );
    expect(evaluateAiPolicy("human_approval_required").requiresHumanApproval).toBe(
      true,
    );
    expect(evaluateAiPolicy("automatic").applyAutomatically).toBe(false);
  });

  it("builds configuration subject keys", () => {
    expect(
      configurationSubjectKey({ extensionPoint: "review" }),
    ).toBe("global:review");
    expect(
      configurationSubjectKey({
        organizationId: "org_1",
        extensionPoint: "review",
        pluginKey: "memory",
      }),
    ).toBe("org:org_1:review:memory");
  });

  it("covers all extension points in catalog", () => {
    expect(AI_EXTENSION_POINTS.length).toBe(7);
    expect(AI_PLUGIN_CAPABILITIES.length).toBe(9);
  });
});

describe("AI public ids", () => {
  it("formats AIX and DEC ids", () => {
    const aix = formatRandomPublicId("ai_execution", "5K9N2R");
    expect(aix).toBe("AIX-5K9N2R");
    expect(isValidPublicId("ai_execution", aix)).toBe(true);
    const dec = formatRandomPublicId("ai_decision", "3P8Q2M");
    expect(dec).toBe("DEC-3P8Q2M");
    expect(isValidPublicId("ai_decision", dec)).toBe(true);
  });
});
