/**
 * Reward strategy definitions for Task Templates.
 */

export const REWARD_STRATEGIES = [
  "fixed",
  "per_unit",
  "tiered",
  "milestone",
  "dynamic_future",
] as const;

export type RewardStrategyKind = (typeof REWARD_STRATEGIES)[number];

export type RewardTier = {
  minUnits: number;
  maxUnits?: number;
  amountMinor: number;
};

export type RewardMilestone = {
  key: string;
  label: string;
  thresholdUnits: number;
  amountMinor: number;
};

export type RewardStrategyDefinition =
  | {
      kind: "fixed";
      amountMinor: number;
      currency: string;
    }
  | {
      kind: "per_unit";
      amountMinor: number;
      currency: string;
    }
  | {
      kind: "tiered";
      currency: string;
      tiers: RewardTier[];
    }
  | {
      kind: "milestone";
      currency: string;
      milestones: RewardMilestone[];
    }
  | {
      kind: "dynamic_future";
      currency: string;
      /** Placeholder for future pricing engines */
      engineKey?: string;
    };

export function validateRewardStrategy(
  strategy: RewardStrategyDefinition,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  if (!strategy.currency?.trim()) {
    errors.push("Reward currency is required");
  }

  switch (strategy.kind) {
    case "fixed":
    case "per_unit":
      if (strategy.amountMinor < 0) {
        errors.push("Reward amount must be >= 0");
      }
      break;
    case "tiered":
      if (!strategy.tiers.length) errors.push("Tiered reward needs tiers");
      break;
    case "milestone":
      if (!strategy.milestones.length) {
        errors.push("Milestone reward needs milestones");
      }
      break;
    case "dynamic_future":
      break;
    default: {
      const _exhaustive: never = strategy;
      return { ok: false, errors: [`Unknown strategy ${String(_exhaustive)}`] };
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
