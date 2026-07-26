/**
 * Checklist progression rules for assignment steps.
 */

import type { AssignmentStepStatus } from "@/constants/work-states";

const TRANSITIONS: Record<
  AssignmentStepStatus,
  readonly AssignmentStepStatus[]
> = {
  pending: ["in_progress", "skipped", "failed"],
  in_progress: ["completed", "skipped", "failed", "pending"],
  completed: [],
  skipped: ["pending"],
  failed: ["pending", "in_progress"],
};

export function canTransitionStep(
  from: AssignmentStepStatus,
  to: AssignmentStepStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertStepTransition(
  from: AssignmentStepStatus,
  to: AssignmentStepStatus,
): void {
  if (!canTransitionStep(from, to)) {
    throw new Error(`Invalid checklist transition: ${from} → ${to}`);
  }
}

/**
 * Optional steps may skip; required steps cannot skip.
 */
export function canSkipStep(required: boolean): boolean {
  return !required;
}

/**
 * Dependencies satisfied when each dep is completed or skipped.
 */
export function dependenciesSatisfied(params: {
  dependsOnStepKeys: readonly string[];
  statusByKey: Record<string, AssignmentStepStatus>;
}): boolean {
  return params.dependsOnStepKeys.every((key) => {
    const status = params.statusByKey[key];
    return status === "completed" || status === "skipped";
  });
}
