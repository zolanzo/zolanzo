/**
 * Worker recommendations — practical next steps with explainability.
 */

import { isWorkerRecommendationsEnabled } from "@/lib/ai/copilot/worker-config";
import type {
  WorkerCopilotIntent,
  WorkerCopilotRecommendation,
  WorkerKnowledgeFacts,
} from "@/lib/ai/copilot/worker-types";
import type { WorkerRetrievedKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (t - Date.now()) / 3_600_000;
}

export function buildWorkerRecommendations(params: {
  intent: WorkerCopilotIntent;
  facts: WorkerKnowledgeFacts;
  retrieved: WorkerRetrievedKnowledge;
  enabled?: boolean;
}): WorkerCopilotRecommendation[] {
  if (!(params.enabled ?? isWorkerRecommendationsEnabled())) return [];

  const recs: WorkerCopilotRecommendation[] = [];
  const top = params.retrieved.assignments[0];

  if (
    top &&
    [
      "next_best_task",
      "deadlines",
      "my_assignments",
      "assignment_coach",
      "unknown",
    ].includes(params.intent)
  ) {
    const hrs = hoursUntil(top.expiresAt);
    recs.push({
      code: "complete_assignment",
      label: `Complete Assignment ${top.publicId}${hrs != null && hrs < 12 ? " today" : ""}`,
      reason:
        hrs != null && hrs < 24
          ? `Expires in ~${Math.max(0, Math.round(hrs))} hours`
          : "Highest priority among your open work",
      estimatedPayoutMinor: top.rewardMinor,
      confidence: 0.9,
      expectedApproval:
        params.facts.approvalRate >= 0.85
          ? "high"
          : params.facts.approvalRate >= 0.65
            ? "medium"
            : "low",
      workflowHint: "assignments.workspace",
    });
  }

  if (params.intent === "missing_evidence" || params.intent === "assignment_coach") {
    const focus = params.retrieved.assignments[0];
    if (focus) {
      const missing = focus.requiredEvidenceKinds.filter(
        (k) => !focus.presentEvidenceKinds.includes(k),
      );
      if (missing.length) {
        recs.push({
          code: "upload_evidence",
          label: `Upload required: ${missing[0]}`,
          reason: `${missing.length} evidence item(s) still missing`,
          estimatedPayoutMinor: focus.rewardMinor,
          confidence: 0.92,
          expectedApproval: "medium",
          workflowHint: "submissions.evidence",
        });
      }
      if (focus.gpsRequired && focus.gpsSatisfied === true) {
        recs.push({
          code: "gps_ok",
          label: "You're inside the required GPS radius",
          reason: "Location check passed for this assignment",
          confidence: 0.95,
          expectedApproval: "high",
          workflowHint: "assignments.workspace",
        });
      }
    }
  }

  if (params.intent === "nearby_work") {
    recs.push({
      code: "accept_nearby",
      label: "Accept nearby work to reduce travel",
      reason: "Lower distance usually improves on-time completion",
      confidence: 0.84,
      expectedApproval: "high",
      workflowHint: "marketplace.browse",
    });
  }

  if (
    params.facts.assignments.filter((a) =>
      ["assigned", "in_progress", "started"].includes(a.status),
    ).length >= 2
  ) {
    recs.push({
      code: "finish_before_accept",
      label: "Finish today's assignment before accepting another",
      reason: "Multiple active assignments raise expiry risk",
      confidence: 0.88,
      expectedApproval: null,
      workflowHint: "assignments.list",
    });
  }

  if (!params.facts.emailVerified || !params.facts.phoneVerified) {
    recs.push({
      code: "verify_identity",
      label: "Update your verification documents",
      reason: "Verified workers typically see higher approval rates",
      confidence: 0.86,
      expectedApproval: null,
      workflowHint: "profile.verification",
    });
  }

  if (params.intent === "highest_pay_today" && top) {
    recs.push({
      code: "take_highest_pay",
      label: `Prioritize ${top.publicId} (${(top.rewardMinor / 100).toFixed(0)} ${top.currency})`,
      reason: "Highest payout among your open assignments",
      estimatedPayoutMinor: top.rewardMinor,
      confidence: 0.91,
      expectedApproval:
        params.facts.approvalRate >= 0.8 ? "high" : "medium",
      workflowHint: "assignments.workspace",
    });
  }

  return recs.slice(0, 5);
}

export function workerSuggestedFollowUps(
  intent: WorkerCopilotIntent,
): string[] {
  switch (intent) {
    case "next_best_task":
      return ["Why?", "What pays more?", "Which one finishes fastest?"];
    case "assignment_coach":
    case "missing_evidence":
      return ["Am I ready to submit?", "Why was my previous submission rejected?"];
    case "nearby_work":
      return ["What pays more?", "What should I do next?"];
    case "weekly_earnings":
      return ["Show my payment history", "How can I improve my approval rate?"];
    default:
      return [
        "What should I do next?",
        "Which assignments expire soon?",
        "How much have I earned this week?",
      ];
  }
}
