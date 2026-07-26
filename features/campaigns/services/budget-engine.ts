/**
 * Declarative campaign budget calculations (no wallet integration).
 */

export type BudgetModelKind = "fixed" | "quantity_times_reward";

export type CampaignBudgetInput = {
  kind: BudgetModelKind;
  currency: string;
  /** Fixed total budget (minor units) when kind=fixed */
  fixedBudgetMinor?: number;
  targetQuantity: number;
  /** Reward per approved unit (minor) */
  rewardPerUnitMinor: number;
  reservedBudgetMinor?: number;
  spentBudgetMinor?: number;
};

export type CampaignBudgetSnapshot = {
  kind: BudgetModelKind;
  currency: string;
  targetQuantity: number;
  rewardPerUnitMinor: number;
  /** Total authorized budget */
  budgetMinor: number;
  reservedBudgetMinor: number;
  spentBudgetMinor: number;
  remainingBudgetMinor: number;
  /** targetQuantity × rewardPerUnitMinor */
  projectedCompletionCostMinor: number;
  isValid: boolean;
  errors: string[];
};

export function calculateCampaignBudget(
  input: CampaignBudgetInput,
): CampaignBudgetSnapshot {
  const errors: string[] = [];
  const reserved = input.reservedBudgetMinor ?? 0;
  const spent = input.spentBudgetMinor ?? 0;

  if (input.targetQuantity < 0) {
    errors.push("targetQuantity must be >= 0");
  }
  if (input.rewardPerUnitMinor < 0) {
    errors.push("rewardPerUnitMinor must be >= 0");
  }
  if (reserved < 0 || spent < 0) {
    errors.push("reserved/spent budgets must be >= 0");
  }

  const projectedCompletionCostMinor =
    input.targetQuantity * input.rewardPerUnitMinor;

  let budgetMinor = 0;
  if (input.kind === "fixed") {
    budgetMinor = input.fixedBudgetMinor ?? 0;
    if (budgetMinor <= 0) {
      errors.push("fixedBudgetMinor must be > 0 for fixed budgets");
    }
    if (budgetMinor < projectedCompletionCostMinor) {
      errors.push(
        "Fixed budget is less than projected completion cost (quantity × reward)",
      );
    }
  } else {
    budgetMinor = projectedCompletionCostMinor;
    if (budgetMinor <= 0 && input.targetQuantity > 0) {
      errors.push("quantity × reward must be > 0");
    }
  }

  if (reserved + spent > budgetMinor) {
    errors.push("Reserved + spent exceeds total budget");
  }

  const remainingBudgetMinor = Math.max(0, budgetMinor - reserved - spent);

  return {
    kind: input.kind,
    currency: input.currency,
    targetQuantity: input.targetQuantity,
    rewardPerUnitMinor: input.rewardPerUnitMinor,
    budgetMinor,
    reservedBudgetMinor: reserved,
    spentBudgetMinor: spent,
    remainingBudgetMinor,
    projectedCompletionCostMinor,
    isValid: errors.length === 0,
    errors,
  };
}
