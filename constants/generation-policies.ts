/**
 * Generation policies — how many Task Instances should exist.
 * Distinct from Generation Strategy (when creation runs).
 */

export const GENERATION_POLICIES = [
  "fixed_quantity",
  "rolling_window",
  "demand_buffer",
  "scheduled_batch",
  "api_controlled",
] as const;

export type GenerationPolicy = (typeof GENERATION_POLICIES)[number];

export type GenerationPolicyConfig =
  | {
      policy: "fixed_quantity";
      /** Exact total to generate (usually campaign.targetQuantity) */
      quantity: number;
    }
  | {
      policy: "rolling_window";
      /** Always try to keep this many available */
      windowSize: number;
    }
  | {
      policy: "demand_buffer";
      /** Target available inventory */
      maintainAvailable: number;
      /** Generate when available falls below this */
      refillBelow: number;
    }
  | {
      policy: "scheduled_batch";
      /** Units per scheduled run */
      batchSize: number;
      /** Declarative cadence (minutes or cron later) */
      intervalMinutes?: number;
      cronExpression?: string;
    }
  | {
      policy: "api_controlled";
      /** Max units per API call (optional guardrail) */
      maxPerRequest?: number;
    };

export function isGenerationPolicy(value: string): value is GenerationPolicy {
  return (GENERATION_POLICIES as readonly string[]).includes(value);
}
