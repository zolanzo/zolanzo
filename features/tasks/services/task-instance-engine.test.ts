import { describe, expect, it } from "vitest";
import { resolveGenerationQuantity } from "@/features/tasks/services/policies";
import {
  buildInventoryAnalytics,
  emptyInventoryCounts,
  projectInventoryAfterGeneration,
} from "@/features/tasks/services/inventory";
import { previewGeneration } from "@/features/tasks/services/preview";
import {
  canTransitionTaskInstance,
  isImmutableTaskInstanceField,
} from "@/features/tasks/services/lifecycle";
import { isGenerationPolicy } from "@/constants/generation-policies";
import { isGenerationStrategy } from "@/constants/generation-strategies";
import { isValidPublicId, formatRandomPublicId } from "@/lib/public-id/format";

describe("generation policies", () => {
  it("fixed_quantity fills to target", () => {
    const result = resolveGenerationQuantity({
      policy: "fixed_quantity",
      config: { policy: "fixed_quantity", quantity: 50 },
      targetQuantity: 50,
      inventory: { ...emptyInventoryCounts(), available: 10 },
    });
    expect(result.ok).toBe(true);
    expect(result.quantityToGenerate).toBe(40);
  });

  it("rolling_window tops up available", () => {
    const result = resolveGenerationQuantity({
      policy: "rolling_window",
      config: { policy: "rolling_window", windowSize: 100 },
      targetQuantity: 1000,
      inventory: { ...emptyInventoryCounts(), available: 70, claimed: 20 },
    });
    expect(result.quantityToGenerate).toBe(30);
  });

  it("demand_buffer refills only below threshold", () => {
    const idle = resolveGenerationQuantity({
      policy: "demand_buffer",
      config: {
        policy: "demand_buffer",
        maintainAvailable: 200,
        refillBelow: 50,
      },
      targetQuantity: 5000,
      inventory: { ...emptyInventoryCounts(), available: 80 },
    });
    expect(idle.quantityToGenerate).toBe(0);

    const refill = resolveGenerationQuantity({
      policy: "demand_buffer",
      config: {
        policy: "demand_buffer",
        maintainAvailable: 200,
        refillBelow: 50,
      },
      targetQuantity: 5000,
      inventory: { ...emptyInventoryCounts(), available: 40 },
    });
    expect(refill.quantityToGenerate).toBe(160);
  });

  it("scheduled_batch uses batch size", () => {
    const result = resolveGenerationQuantity({
      policy: "scheduled_batch",
      config: { policy: "scheduled_batch", batchSize: 100 },
      targetQuantity: 1000,
      inventory: emptyInventoryCounts(),
    });
    expect(result.quantityToGenerate).toBe(100);
  });

  it("api_controlled requires override", () => {
    const missing = resolveGenerationQuantity({
      policy: "api_controlled",
      config: { policy: "api_controlled", maxPerRequest: 25 },
      targetQuantity: 500,
      inventory: emptyInventoryCounts(),
    });
    expect(missing.ok).toBe(false);

    const ok = resolveGenerationQuantity({
      policy: "api_controlled",
      config: { policy: "api_controlled", maxPerRequest: 25 },
      targetQuantity: 500,
      inventory: emptyInventoryCounts(),
      quantityOverride: 40,
    });
    expect(ok.quantityToGenerate).toBe(25);
  });
});

describe("generation strategies catalog", () => {
  it("recognizes strategies and policies", () => {
    expect(isGenerationStrategy("pre_generated")).toBe(true);
    expect(isGenerationStrategy("on_demand")).toBe(true);
    expect(isGenerationPolicy("fixed_quantity")).toBe(true);
    expect(isGenerationPolicy("rolling_window")).toBe(true);
    expect(isGenerationPolicy("demand_buffer")).toBe(true);
  });
});

describe("lifecycle", () => {
  it("allows generated → available → reserved → claimed → completed", () => {
    expect(canTransitionTaskInstance("generated", "available")).toBe(true);
    expect(canTransitionTaskInstance("available", "reserved")).toBe(true);
    expect(canTransitionTaskInstance("reserved", "claimed")).toBe(true);
    expect(canTransitionTaskInstance("claimed", "completed")).toBe(true);
    expect(canTransitionTaskInstance("completed", "available")).toBe(false);
  });

  it("marks definition fields immutable", () => {
    expect(isImmutableTaskInstanceField("taskTemplateVersion")).toBe(true);
    expect(isImmutableTaskInstanceField("status")).toBe(false);
  });
});

describe("inventory analytics", () => {
  it("computes remaining / consumed / projected", () => {
    const analytics = buildInventoryAnalytics({
      counts: {
        ...emptyInventoryCounts(),
        available: 20,
        reserved: 5,
        claimed: 10,
        completed: 5,
      },
      targetQuantity: 100,
    });
    expect(analytics.totalGenerated).toBe(40);
    expect(analytics.remaining).toBe(60);
    expect(analytics.consumed).toBe(15);
    expect(analytics.available).toBe(20);

    const after = projectInventoryAfterGeneration({
      analytics,
      quantity: 10,
    });
    expect(after.totalGenerated).toBe(50);
    expect(after.available).toBe(30);
    expect(after.remaining).toBe(50);
  });
});

describe("generation preview", () => {
  it("projects cost and inventory impact", () => {
    const preview = previewGeneration({
      campaignId: "c1",
      campaignPublicId: "CMP-2026-000001",
      strategy: "pre_generated",
      policy: "fixed_quantity",
      policyConfig: { policy: "fixed_quantity", quantity: 50 },
      targetQuantity: 50,
      rewardPerUnitMinor: 1000,
      currency: "NGN",
      inventory: emptyInventoryCounts(),
    });
    expect(preview.ok).toBe(true);
    expect(preview.expectedQuantity).toBe(50);
    expect(preview.projectedCostMinor).toBe(50_000);
    expect(preview.inventoryAfterProjected.available).toBe(50);
  });
});

describe("task public ids", () => {
  it("formats TSK random ids", () => {
    const id = formatRandomPublicId("task", "8A92KD");
    expect(id).toBe("TSK-8A92KD");
    expect(isValidPublicId("task", id)).toBe(true);
  });
});
