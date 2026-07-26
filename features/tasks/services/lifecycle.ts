/**
 * Task Instance lifecycle transitions.
 */

import type { TaskInstanceStatus } from "@/constants/work-states";

const TRANSITIONS: Record<
  TaskInstanceStatus,
  readonly TaskInstanceStatus[]
> = {
  generated: ["available", "cancelled", "expired"],
  available: ["reserved", "claimed", "expired", "cancelled"],
  reserved: ["available", "claimed", "expired", "cancelled"],
  claimed: ["completed", "cancelled", "expired"],
  expired: [],
  cancelled: [],
  completed: [],
};

export function canTransitionTaskInstance(
  from: TaskInstanceStatus,
  to: TaskInstanceStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTaskInstanceTransition(
  from: TaskInstanceStatus,
  to: TaskInstanceStatus,
): void {
  if (!canTransitionTaskInstance(from, to)) {
    throw new Error(`Invalid task instance transition: ${from} → ${to}`);
  }
}

/** Core definition fields never change after insert. */
export function isImmutableTaskInstanceField(field: string): boolean {
  const immutable = new Set([
    "campaignId",
    "taskTemplateId",
    "taskTemplateVersion",
    "sequenceNumber",
    "generationStrategy",
    "generationPolicy",
    "generationPolicyConfig",
    "campaignPublicId",
    "templatePublicId",
  ]);
  return immutable.has(field);
}
