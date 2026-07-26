/**
 * Resolve how many Task Instances to create for a generation run.
 */

import type {
  GenerationPolicy,
  GenerationPolicyConfig,
} from "@/constants/generation-policies";
import type { InventoryCounts } from "@/features/tasks/types";

export type PolicyResolutionInput = {
  policy: GenerationPolicy;
  config: GenerationPolicyConfig | null;
  targetQuantity: number;
  inventory: InventoryCounts;
  /** Explicit request size (API / override) */
  quantityOverride?: number;
};

export type PolicyResolution = {
  quantityToGenerate: number;
  reason: string;
  ok: boolean;
  errors: string[];
};

function totalGeneratedCount(inventory: InventoryCounts): number {
  return (
    inventory.generated +
    inventory.available +
    inventory.reserved +
    inventory.claimed +
    inventory.expired +
    inventory.cancelled +
    inventory.completed
  );
}

function resolveConfig(
  policy: GenerationPolicy,
  config: GenerationPolicyConfig | null,
  targetQuantity: number,
): GenerationPolicyConfig {
  if (config && config.policy === policy) return config;
  switch (policy) {
    case "fixed_quantity":
      return { policy: "fixed_quantity", quantity: targetQuantity };
    case "rolling_window":
      return {
        policy: "rolling_window",
        windowSize: Math.min(targetQuantity, 100),
      };
    case "demand_buffer":
      return {
        policy: "demand_buffer",
        maintainAvailable: Math.min(targetQuantity, 50),
        refillBelow: Math.min(10, Math.floor(targetQuantity / 5)),
      };
    case "scheduled_batch":
      return {
        policy: "scheduled_batch",
        batchSize: Math.min(targetQuantity, 100),
      };
    case "api_controlled":
      return { policy: "api_controlled", maxPerRequest: 100 };
  }
}

/**
 * Pure policy math — no DB, no side effects.
 */
export function resolveGenerationQuantity(
  input: PolicyResolutionInput,
): PolicyResolution {
  const errors: string[] = [];
  const config = resolveConfig(
    input.policy,
    input.config,
    input.targetQuantity,
  );
  const totalLive = totalGeneratedCount(input.inventory);
  const remainingCapacity = Math.max(
    0,
    input.targetQuantity - totalLive,
  );

  let quantityToGenerate = 0;
  let reason = "";

  switch (config.policy) {
    case "fixed_quantity": {
      const target = Math.min(config.quantity, input.targetQuantity);
      quantityToGenerate = Math.max(0, target - totalLive);
      reason = `fixed_quantity: fill to ${target} (generated=${totalLive})`;
      break;
    }
    case "rolling_window": {
      const deficit = Math.max(
        0,
        config.windowSize - input.inventory.available,
      );
      quantityToGenerate = Math.min(deficit, remainingCapacity);
      reason = `rolling_window: keep ${config.windowSize} available (available=${input.inventory.available})`;
      break;
    }
    case "demand_buffer": {
      if (input.inventory.available > config.refillBelow) {
        quantityToGenerate = 0;
        reason = `demand_buffer: available ${input.inventory.available} > refillBelow ${config.refillBelow}`;
      } else {
        const deficit = Math.max(
          0,
          config.maintainAvailable - input.inventory.available,
        );
        quantityToGenerate = Math.min(deficit, remainingCapacity);
        reason = `demand_buffer: refill to ${config.maintainAvailable}`;
      }
      break;
    }
    case "scheduled_batch": {
      quantityToGenerate = Math.min(config.batchSize, remainingCapacity);
      reason = `scheduled_batch: batchSize ${config.batchSize}`;
      break;
    }
    case "api_controlled": {
      if (!input.quantityOverride) {
        errors.push("api_controlled requires quantityOverride");
        quantityToGenerate = 0;
        reason = "api_controlled: missing quantityOverride";
        break;
      }
      const capped = config.maxPerRequest
        ? Math.min(input.quantityOverride, config.maxPerRequest)
        : input.quantityOverride;
      quantityToGenerate = Math.min(capped, remainingCapacity);
      reason = `api_controlled: request ${input.quantityOverride}`;
      break;
    }
  }

  if (input.quantityOverride && config.policy !== "api_controlled") {
    quantityToGenerate = Math.min(
      input.quantityOverride,
      remainingCapacity,
    );
    reason = `${reason}; override=${input.quantityOverride}`;
  }

  if (quantityToGenerate < 0) {
    errors.push("quantityToGenerate cannot be negative");
  }

  return {
    quantityToGenerate: Math.max(0, quantityToGenerate),
    reason,
    ok: errors.length === 0,
    errors,
  };
}
