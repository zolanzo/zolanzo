/**
 * Review Policy evaluation — separates validation from decision process.
 */

import type { ReviewPolicyDefinition } from "@/constants/review-policies";
import type { ValidationReportRecord } from "@/features/verification/types";
import type { PolicyEvaluationResult } from "@/features/verification/types/review";

export type PolicyEvaluationInput = {
  policy: ReviewPolicyDefinition;
  report: ValidationReportRecord;
  /** Reward per unit in minor currency units (from execution context) */
  rewardPerUnitMinor?: number | null;
  /** Deterministic or random sample roll in [0, 1) */
  sampleRoll?: number;
};

export function evaluateReviewPolicy(
  input: PolicyEvaluationInput,
): PolicyEvaluationResult {
  const { policy, report } = input;
  const failures = report.failures.length;
  const score = report.overallScore;
  const status = report.overallStatus;

  if (policy.key === "escalate_high_value") {
    const threshold = policy.config.highValueThresholdMinor ?? 50_000;
    const reward = input.rewardPerUnitMinor ?? 0;
    if (reward >= threshold) {
      return {
        action: "enqueue_escalated",
        reason: `High-value reward ${reward} ≥ ${threshold}`,
      };
    }
    return {
      action: "enqueue_human",
      reason: "Below high-value threshold — human review",
    };
  }

  if (policy.key === "always_human" || policy.key === "two_reviewers") {
    return {
      action: "enqueue_human",
      reason: `Policy ${policy.key} requires human review`,
    };
  }

  if (policy.key === "customer_before_approval") {
    return {
      action: "defer",
      reason: "Awaiting customer review (future)",
      outcome: "deferred",
    };
  }

  if (policy.key === "senior_after_rejection") {
    return {
      action: "enqueue_human",
      reason: "Primary human review; senior path after rejection",
    };
  }

  // auto_approve_high_score + random_audit share score gates
  const minScore = policy.config.autoApproveMinScore ?? 90;
  const requireNoFailures = policy.config.requireNoFailures !== false;

  if (status === "failed" || (requireNoFailures && failures > 0)) {
    if (policy.mode === "automatic") {
      return {
        action: "enqueue_human",
        reason: "Validation failures — escalate to human",
      };
    }
    return {
      action: "enqueue_human",
      reason: "Validation failed — human review required",
    };
  }

  if (score < minScore) {
    return {
      action: "enqueue_human",
      reason: `Score ${score} below auto-approve threshold ${minScore}`,
    };
  }

  if (policy.key === "random_audit") {
    const rate = policy.config.samplingRate ?? 0.05;
    const roll = input.sampleRoll ?? Math.random();
    if (roll < rate) {
      return {
        action: "enqueue_human",
        reason: `Random audit sample (roll ${roll.toFixed(3)} < ${rate})`,
      };
    }
  }

  return {
    action: "auto_approve",
    reason: `Auto-approve: score ${score} ≥ ${minScore}, no failures`,
    outcome: "approved",
  };
}
