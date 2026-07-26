/**
 * Build ordered execution steps from Task Template capability set.
 */

import type { TemplateStepDefinition } from "@/features/task-templates/types";

export type ExecutionStepDefinition = {
  sequence: number;
  stepKey: string;
  capability: string;
  instruction: string;
  required: boolean;
  conditionalKey: string | null;
  dependsOnStepKeys: string[];
  estimatedDurationMin: number | null;
  config: Record<string, unknown> | null;
};

/**
 * Convert template capability steps into ordered execution definitions.
 * Dependencies default to previous required step (linear flow).
 */
export function buildExecutionPlan(params: {
  capabilitySet: readonly TemplateStepDefinition[];
  estimatedDurationMin?: number | null;
}): ExecutionStepDefinition[] {
  const steps = params.capabilitySet;
  if (steps.length === 0) {
    throw new Error("Execution plan requires at least one capability step");
  }

  const perStepEstimate =
    params.estimatedDurationMin && steps.length > 0
      ? Math.max(1, Math.round(params.estimatedDurationMin / steps.length))
      : null;

  const keys = steps.map((s) => s.key);
  const seen = new Set<string>();

  return steps.map((step, index) => {
    if (seen.has(step.key)) {
      throw new Error(`Duplicate execution step key: ${step.key}`);
    }
    seen.add(step.key);

    const dependsOnStepKeys: string[] = [];
    if (index > 0) {
      // Linear dependency on previous step (future: explicit config.dependsOn)
      const explicit = step.config?.dependsOn;
      if (Array.isArray(explicit)) {
        for (const dep of explicit) {
          if (typeof dep === "string" && keys.includes(dep)) {
            dependsOnStepKeys.push(dep);
          }
        }
      } else {
        dependsOnStepKeys.push(steps[index - 1]!.key);
      }
    }

    const conditionalKey =
      typeof step.config?.conditionalKey === "string"
        ? step.config.conditionalKey
        : null;

    return {
      sequence: index + 1,
      stepKey: step.key,
      capability: step.capability,
      instruction: step.instruction,
      required: step.required,
      conditionalKey,
      dependsOnStepKeys,
      estimatedDurationMin:
        typeof step.config?.estimatedDurationMin === "number"
          ? step.config.estimatedDurationMin
          : perStepEstimate,
      config: step.config ?? null,
    };
  });
}

export function assertExecutionOrder(
  plan: readonly ExecutionStepDefinition[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const keys = new Set(plan.map((p) => p.stepKey));
  const sequences = new Set<number>();

  for (const step of plan) {
    if (sequences.has(step.sequence)) {
      errors.push(`Duplicate sequence ${step.sequence}`);
    }
    sequences.add(step.sequence);
    for (const dep of step.dependsOnStepKeys) {
      if (!keys.has(dep)) {
        errors.push(`Step ${step.stepKey} depends on missing ${dep}`);
      }
      if (dep === step.stepKey) {
        errors.push(`Step ${step.stepKey} cannot depend on itself`);
      }
    }
  }

  const sorted = [...plan].sort((a, b) => a.sequence - b.sequence);
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i]!.sequence !== i + 1) {
      errors.push("Sequences must be contiguous starting at 1");
      break;
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
