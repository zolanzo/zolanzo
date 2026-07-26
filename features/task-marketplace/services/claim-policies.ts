/**
 * Evaluate claim policies — separate from eligibility.
 */

import type { ClaimPolicyRule } from "@/constants/claim-policies";
import { validateClaimPolicyRules } from "@/constants/claim-policies";
import type { WorkerEligibilityContext } from "@/features/task-marketplace/types/worker-context";

export type ClaimPolicyWorkerStats = {
  activeAssignmentCount: number;
  activeAssignmentsForCampaign: number;
  lastCompletedAt: string | null;
};

export type ClaimPolicyEvaluation = {
  allowed: boolean;
  errors: string[];
  /** Future policies noted but not blocking yet */
  deferred: string[];
};

export function evaluateClaimPolicies(params: {
  rules: readonly ClaimPolicyRule[];
  worker: WorkerEligibilityContext;
  campaignOrganizationId: string;
  stats: ClaimPolicyWorkerStats;
  now?: Date;
}): ClaimPolicyEvaluation {
  const shape = validateClaimPolicyRules(params.rules);
  if (!shape.ok) {
    return { allowed: false, errors: shape.errors, deferred: [] };
  }

  const errors: string[] = [];
  const deferred: string[] = [];
  const now = params.now ?? new Date();

  for (const rule of params.rules) {
    switch (rule.kind) {
      case "one_active_per_campaign":
        if (params.stats.activeAssignmentsForCampaign > 0) {
          errors.push("Worker already has an active assignment for this campaign");
        }
        break;
      case "max_concurrent_assignments":
        if (params.stats.activeAssignmentCount >= rule.max) {
          errors.push(
            `Worker has reached max concurrent assignments (${rule.max})`,
          );
        }
        break;
      case "cooldown_after_completion": {
        if (params.stats.lastCompletedAt) {
          const last = new Date(params.stats.lastCompletedAt).getTime();
          const elapsedMin = (now.getTime() - last) / 60_000;
          if (elapsedMin < rule.cooldownMinutes) {
            errors.push(
              `Cooldown active: wait ${Math.ceil(rule.cooldownMinutes - elapsedMin)} more minutes`,
            );
          }
        }
        break;
      }
      case "invite_only":
        if (rule.inviteTokenRequired !== false && !params.worker.inviteToken) {
          errors.push("Invite token required for this campaign");
        }
        break;
      case "organization_only": {
        const allowed =
          rule.organizationIds?.length
            ? rule.organizationIds
            : [params.campaignOrganizationId];
        const ok = params.worker.organizationIds.some((id) =>
          allowed.includes(id),
        );
        if (!ok) {
          errors.push("Worker must belong to an allowed organization");
        }
        break;
      }
      case "first_come_first_served":
        // Handled by reservation concurrency — always allowed at policy layer.
        break;
      case "lottery_future":
        deferred.push("lottery_future is not enforced yet");
        break;
      case "priority_trust_future":
        if (
          typeof rule.minTrustScore === "number" &&
          params.worker.trustScore < rule.minTrustScore
        ) {
          deferred.push(
            `priority_trust_future would require trust >= ${rule.minTrustScore}`,
          );
        } else {
          deferred.push("priority_trust_future is not enforced yet");
        }
        break;
    }
  }

  return {
    allowed: errors.length === 0,
    errors,
    deferred,
  };
}
