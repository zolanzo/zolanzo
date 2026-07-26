/**
 * Generation preview — expected quantity, cost, inventory impact.
 */

import type { GenerationStrategy } from "@/constants/generation-strategies";
import type {
  GenerationPolicy,
  GenerationPolicyConfig,
} from "@/constants/generation-policies";
import { resolveGenerationQuantity } from "@/features/tasks/services/policies";
import {
  buildInventoryAnalytics,
  projectInventoryAfterGeneration,
} from "@/features/tasks/services/inventory";
import type {
  GenerationPreview,
  InventoryCounts,
} from "@/features/tasks/types";

export type PreviewInput = {
  campaignId: string;
  campaignPublicId: string;
  strategy: GenerationStrategy;
  policy: GenerationPolicy;
  policyConfig: GenerationPolicyConfig | null;
  targetQuantity: number;
  rewardPerUnitMinor: number;
  currency: string;
  inventory: InventoryCounts;
  quantityOverride?: number;
};

export function previewGeneration(input: PreviewInput): GenerationPreview {
  const inventoryBefore = buildInventoryAnalytics({
    counts: input.inventory,
    targetQuantity: input.targetQuantity,
  });

  const resolution = resolveGenerationQuantity({
    policy: input.policy,
    config: input.policyConfig,
    targetQuantity: input.targetQuantity,
    inventory: input.inventory,
    quantityOverride: input.quantityOverride,
  });

  const expectedQuantity = resolution.ok ? resolution.quantityToGenerate : 0;
  const projectedCostMinor = expectedQuantity * input.rewardPerUnitMinor;
  const inventoryAfterProjected = projectInventoryAfterGeneration({
    analytics: inventoryBefore,
    quantity: expectedQuantity,
  });

  return {
    campaignId: input.campaignId,
    campaignPublicId: input.campaignPublicId,
    strategy: input.strategy,
    policy: input.policy,
    expectedQuantity,
    rewardPerUnitMinor: input.rewardPerUnitMinor,
    projectedCostMinor,
    currency: input.currency,
    inventoryBefore,
    inventoryAfterProjected,
    errors: resolution.errors,
    ok: resolution.ok,
  };
}
