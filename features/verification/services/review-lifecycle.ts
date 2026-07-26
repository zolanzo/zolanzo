/**
 * Review queue / lifecycle transitions.
 */

import {
  REVIEW_QUEUE_TRANSITIONS,
  type ReviewLifecycleStatus,
  type ReviewQueueStatus,
} from "@/constants/work-states";

export function canTransitionReviewQueue(
  from: ReviewQueueStatus,
  to: ReviewQueueStatus,
): boolean {
  return REVIEW_QUEUE_TRANSITIONS[from].includes(to);
}

export function assertReviewQueueTransition(
  from: ReviewQueueStatus,
  to: ReviewQueueStatus,
): void {
  if (!canTransitionReviewQueue(from, to)) {
    throw new Error(`Invalid review queue transition: ${from} → ${to}`);
  }
}

export function lifecycleForQueueStatus(
  status: ReviewQueueStatus,
): ReviewLifecycleStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "assigned":
      return "assigned";
    case "in_review":
      return "in_review";
    case "completed":
      return "decision_recorded";
    case "escalated":
      return "in_review";
    case "deferred":
      return "pending";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function mapOutcomeToSubmissionStatus(
  outcome: string,
): "approved" | "rejected" | "revision_requested" | "in_review" {
  switch (outcome) {
    case "approved":
    case "approved_with_warning":
      return "approved";
    case "rejected":
      return "rejected";
    case "revision_requested":
      return "revision_requested";
    case "escalated":
    case "deferred":
      return "in_review";
    default:
      return "in_review";
  }
}

export function mapOutcomeToAssignmentStatus(
  outcome: string,
): "approved" | "rejected" | "revision_requested" | "escalated" | "under_review" {
  switch (outcome) {
    case "approved":
    case "approved_with_warning":
      return "approved";
    case "rejected":
      return "rejected";
    case "revision_requested":
      return "revision_requested";
    case "escalated":
      return "escalated";
    case "deferred":
      return "under_review";
    default:
      return "under_review";
  }
}
