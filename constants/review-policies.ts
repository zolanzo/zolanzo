/**
 * Review Policies — how a submission reaches a decision (not validation).
 */

import type { ReviewMode, ReviewPolicyKey } from "@/constants/work-states";

export type ReviewPolicyDownstreamAction =
  | "release_escrow"
  | "refund_escrow"
  | "notify_worker"
  | "notify_client"
  | "reopen_assignment"
  | "credit_wallet"
  | "none";

export type ReviewPolicyDefinition = {
  key: ReviewPolicyKey;
  name: string;
  description: string;
  mode: ReviewMode;
  /** Declared downstream hooks — not wired in Sprint 9 */
  downstreamActions: Partial<
    Record<
      | "approved"
      | "approved_with_warning"
      | "revision_requested"
      | "rejected"
      | "escalated"
      | "deferred",
      ReviewPolicyDownstreamAction[]
    >
  >;
  config: {
    /** Auto-approve when validation overallScore >= this (0–100) */
    autoApproveMinScore?: number;
    /** Require no validation failures */
    requireNoFailures?: boolean;
    /** Sampling rate 0–1 for random_audit */
    samplingRate?: number;
    /** Independent reviewers required */
    reviewerCount?: number;
    /** Treat as high-value above this reward minor units */
    highValueThresholdMinor?: number;
  };
};

export const REVIEW_POLICIES: Record<ReviewPolicyKey, ReviewPolicyDefinition> = {
  auto_approve_high_score: {
    key: "auto_approve_high_score",
    name: "Auto-approve high score",
    description:
      "Automatically approve when validation passes with score ≥ threshold.",
    mode: "automatic",
    config: {
      autoApproveMinScore: 90,
      requireNoFailures: true,
    },
    downstreamActions: {
      approved: ["release_escrow", "credit_wallet", "notify_worker"],
      rejected: ["refund_escrow", "notify_worker"],
      revision_requested: ["reopen_assignment", "notify_worker"],
    },
  },
  always_human: {
    key: "always_human",
    name: "Always human review",
    description: "Every submission requires a human reviewer decision.",
    mode: "human",
    config: {},
    downstreamActions: {
      approved: ["release_escrow", "credit_wallet"],
      approved_with_warning: ["release_escrow", "credit_wallet", "notify_client"],
      rejected: ["refund_escrow"],
      revision_requested: ["reopen_assignment", "notify_worker"],
      escalated: ["notify_client"],
    },
  },
  random_audit: {
    key: "random_audit",
    name: "Random quality audit",
    description:
      "Auto-approve most passing submissions; sample a percentage for human review.",
    mode: "human",
    config: {
      autoApproveMinScore: 80,
      requireNoFailures: true,
      samplingRate: 0.05,
    },
    downstreamActions: {
      approved: ["release_escrow", "credit_wallet"],
      revision_requested: ["reopen_assignment"],
      rejected: ["refund_escrow"],
    },
  },
  two_reviewers: {
    key: "two_reviewers",
    name: "Two independent reviewers",
    description: "Requires two human reviewers before a final decision.",
    mode: "two_person",
    config: { reviewerCount: 2 },
    downstreamActions: {
      approved: ["release_escrow", "credit_wallet"],
      rejected: ["refund_escrow"],
    },
  },
  senior_after_rejection: {
    key: "senior_after_rejection",
    name: "Senior after rejection",
    description: "Escalate to a senior reviewer after a rejection decision.",
    mode: "escalation",
    config: {},
    downstreamActions: {
      rejected: ["notify_client"],
      escalated: ["notify_client"],
      approved: ["release_escrow", "credit_wallet"],
    },
  },
  customer_before_approval: {
    key: "customer_before_approval",
    name: "Customer review before approval",
    description: "Client must confirm before final approval (future wiring).",
    mode: "customer_future",
    config: {},
    downstreamActions: {
      approved: ["release_escrow", "credit_wallet", "notify_client"],
      deferred: ["notify_client"],
    },
  },
  escalate_high_value: {
    key: "escalate_high_value",
    name: "Escalate high-value",
    description: "High-reward submissions escalate automatically.",
    mode: "escalation",
    config: { highValueThresholdMinor: 50_000 },
    downstreamActions: {
      escalated: ["notify_client"],
      approved: ["release_escrow", "credit_wallet"],
    },
  },
};

export function getReviewPolicy(key: ReviewPolicyKey): ReviewPolicyDefinition {
  return REVIEW_POLICIES[key];
}

export function listReviewPolicies(): ReviewPolicyDefinition[] {
  return Object.values(REVIEW_POLICIES);
}
