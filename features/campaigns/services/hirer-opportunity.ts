/**
 * Pure validation for the hirer campaign create form.
 * Server actions still re-validate before persistence.
 */

export type HirerOpportunityInput = {
  title: string;
  category: string;
  description: string;
  instructions: string;
  requirements: string;
  rewardNaira: number;
  slots: number;
  taskTemplateId: string;
  countries: string;
  languages: string;
  platform?: string;
};

export type HirerOpportunityValidation = {
  ok: boolean;
  errors: string[];
  rewardNaira: number;
  slots: number;
  budgetNaira: number;
};

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function splitScopeList(value: string): string[] {
  return splitList(value);
}

export function validateHirerOpportunityInput(
  input: HirerOpportunityInput,
): HirerOpportunityValidation {
  const errors: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const instructions = input.instructions.trim();

  if (!title) errors.push("Title is required");
  if (!description) errors.push("Description is required");
  if (!instructions) errors.push("Instructions are required");
  if (!input.taskTemplateId.trim()) errors.push("A task template is required");

  const rewardNaira = Number(input.rewardNaira);
  if (!Number.isFinite(rewardNaira) || rewardNaira <= 0) {
    errors.push("Reward per completion must be greater than zero");
  }

  const slots = Number(input.slots);
  if (!Number.isInteger(slots) || slots < 1) {
    errors.push("Number of completions must be at least 1");
  }

  const budgetNaira =
    Number.isFinite(rewardNaira) && Number.isInteger(slots) && slots > 0
      ? rewardNaira * slots
      : 0;
  if (budgetNaira <= 0 && errors.every((e) => !e.includes("Reward") && !e.includes("completions"))) {
    errors.push("Total budget must be sufficient (reward × completions)");
  }

  return {
    ok: errors.length === 0,
    errors,
    rewardNaira,
    slots,
    budgetNaira,
  };
}
