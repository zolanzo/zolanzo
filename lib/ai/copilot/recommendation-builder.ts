/**
 * RecommendationBuilder — advisory next steps linking to existing workflows.
 */

import { isOrgRecommendationsEnabled } from "@/lib/ai/copilot/org-config";
import type {
  OrgCopilotIntent,
  OrgCopilotRecommendation,
} from "@/lib/ai/copilot/org-types";
import type { RetrievedKnowledge } from "@/lib/ai/copilot/knowledge-retriever";

export function buildOrgRecommendations(params: {
  intent: OrgCopilotIntent;
  retrieved: RetrievedKnowledge;
  enabled?: boolean;
}): OrgCopilotRecommendation[] {
  if (!(params.enabled ?? isOrgRecommendationsEnabled())) {
    return [];
  }

  const recs: OrgCopilotRecommendation[] = [];
  const { intent, retrieved } = params;

  switch (intent) {
    case "campaigns_behind_schedule":
      if (retrieved.campaigns[0]) {
        recs.push({
          code: "review_campaign",
          label: `Review campaign ${retrieved.campaigns[0].publicId}`,
          workflowHint: "campaigns.detail",
        });
        recs.push({
          code: "invite_workers",
          label: "Invite more workers in underperforming regions",
          workflowHint: "marketplace.invite",
        });
      }
      break;
    case "top_workers":
      recs.push({
        code: "promote_workers",
        label: "Consider promoting top workers to preferred lists",
        workflowHint: "workers.preferred",
      });
      break;
    case "reviewer_workload":
      if ((retrieved.metrics.totalPending as number) > 0) {
        recs.push({
          code: "investigate_workload",
          label: "Investigate reviewer workload and rebalance queues",
          workflowHint: "reviews.queue",
        });
      }
      break;
    case "pending_payments":
      recs.push({
        code: "review_payments",
        label: "Review pending payments in finance",
        workflowHint: "payments.list",
      });
      break;
    case "fraud_trends":
      recs.push({
        code: "verify_suspicious",
        label: "Verify suspicious submissions via Review Assistant",
        workflowHint: "reviews.fraud",
      });
      break;
    case "regional_performance":
      recs.push({
        code: "invite_region",
        label: `Invite more workers in ${retrieved.metrics.lowestRegion ?? "low-performing regions"}`,
        workflowHint: "marketplace.invite",
      });
      break;
    case "organization_spending":
      recs.push({
        code: "increase_budget",
        label: "Increase campaign budget where spend approaches limit",
        workflowHint: "campaigns.budget",
      });
      break;
    case "inactive_workers":
      recs.push({
        code: "reengage_workers",
        label: "Re-engage inactive workers with open opportunities",
        workflowHint: "marketplace.browse",
      });
      break;
    case "assignment_backlog":
      recs.push({
        code: "invite_workers",
        label: "Invite more workers to clear assignment backlog",
        workflowHint: "marketplace.invite",
      });
      break;
    default:
      recs.push({
        code: "open_command_center",
        label: "Open Command Center for operational overview",
        workflowHint: "admin.command_center",
      });
  }

  return recs;
}

export function suggestedFollowUps(intent: OrgCopilotIntent): string[] {
  switch (intent) {
    case "campaigns_behind_schedule":
      return [
        "Why?",
        "Show affected workers",
        "Which regions are underperforming?",
      ];
    case "top_workers":
      return [
        "Which campaigns did they complete?",
        "Show inactive workers",
      ];
    case "fraud_trends":
      return [
        "Which campaign has the highest fraud risk?",
        "Show reviewer workload",
      ];
    case "pending_payments":
      return ["How much have we spent this quarter?"];
    case "regional_performance":
      return ["Which campaigns are behind schedule?"];
    default:
      return [
        "Which campaigns are behind schedule?",
        "Who are my top-performing workers this month?",
        "What payments are still pending?",
      ];
  }
}
