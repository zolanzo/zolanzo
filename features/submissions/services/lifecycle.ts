/**
 * Submission lifecycle transitions.
 */

import {
  SUBMISSION_TRANSITIONS,
  type SubmissionStatus,
} from "@/constants/work-states";

export function canTransitionSubmission(
  from: SubmissionStatus,
  to: SubmissionStatus,
): boolean {
  return SUBMISSION_TRANSITIONS[from].includes(to);
}

export function assertSubmissionTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): void {
  if (!canTransitionSubmission(from, to)) {
    throw new Error(`Invalid submission transition: ${from} → ${to}`);
  }
}

/** Evidence mutability window */
export function isEvidenceMutable(status: SubmissionStatus): boolean {
  return status === "draft" || status === "ready";
}

export function isSubmissionImmutable(status: SubmissionStatus): boolean {
  return !(status === "draft" || status === "ready" || status === "revision_requested");
}
