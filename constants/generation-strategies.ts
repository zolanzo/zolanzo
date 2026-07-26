/**
 * Task generation strategies — metadata only until Task Generator sprint.
 */

export const GENERATION_STRATEGIES = [
  "pre_generated",
  "on_demand",
  "batch",
  "streaming",
  "api_driven",
] as const;

export type GenerationStrategy = (typeof GENERATION_STRATEGIES)[number];

export type GenerationStrategyConfig =
  | { strategy: "pre_generated" }
  | { strategy: "on_demand" }
  | {
      strategy: "batch";
      /** Units per batch */
      batchSize: number;
      /** Cron-like or interval minutes (declarative) */
      intervalMinutes: number;
    }
  | {
      strategy: "streaming";
      sourceKey?: string;
    }
  | {
      strategy: "api_driven";
      allowExternalCreate: boolean;
    };

export function isGenerationStrategy(
  value: string,
): value is GenerationStrategy {
  return (GENERATION_STRATEGIES as readonly string[]).includes(value);
}
