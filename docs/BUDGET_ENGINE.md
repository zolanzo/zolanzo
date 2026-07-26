# Budget Engine

Declarative campaign budget calculations — **no wallet / escrow integration yet**.

## Models

- **fixed** — Client sets `budgetMinor`; must cover projected completion cost.
- **quantity_times_reward** — `budgetMinor = targetQuantity × rewardPerUnitMinor`.

## Snapshot fields

- `budgetMinor`
- `reservedBudgetMinor`
- `spentBudgetMinor`
- `remainingBudgetMinor` = budget − reserved − spent
- `projectedCompletionCostMinor` = target × reward
- `isValid` + `errors`

Implementation: `features/campaigns/services/budget-engine.ts`
