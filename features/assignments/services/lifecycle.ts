/**
 * Assignment workspace lifecycle transitions.
 */

import {
  ASSIGNMENT_TRANSITIONS,
  type AssignmentStatus,
} from "@/constants/work-states";

export function canTransitionAssignment(
  from: AssignmentStatus,
  to: AssignmentStatus,
): boolean {
  return ASSIGNMENT_TRANSITIONS[from].includes(to);
}

export function assertAssignmentTransition(
  from: AssignmentStatus,
  to: AssignmentStatus,
): void {
  if (!canTransitionAssignment(from, to)) {
    throw new Error(`Invalid assignment transition: ${from} → ${to}`);
  }
}

export function normalizeAssignmentStatus(
  status: AssignmentStatus,
): AssignmentStatus {
  return status === "claimed" ? "assigned" : status;
}
