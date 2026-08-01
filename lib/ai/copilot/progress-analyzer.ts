/**
 * ProgressAnalyzer — worker personal progress coach signals.
 */

import type { WorkerKnowledgeFacts } from "@/lib/ai/copilot/worker-types";
import type { WorkerRetrievedKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";
import { buildProgressCoachLines } from "@/lib/ai/copilot/assignment-context-builder";

export type WorkerProgressAnalysis = {
  lines: string[];
  completedAssignments: number;
  approvalRate: number;
  trustScore: number;
  earningsThisWeekMinor: number;
  upcomingDeadlines: number;
  avgReviewHours: number | null;
  avgPaymentHours: number | null;
};

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (t - Date.now()) / 3_600_000;
}

export function analyzeWorkerProgress(params: {
  facts: WorkerKnowledgeFacts;
  retrieved: WorkerRetrievedKnowledge;
}): WorkerProgressAnalysis {
  const upcomingDeadlines = params.retrieved.assignments.filter((a) => {
    const h = hoursUntil(a.expiresAt);
    return h != null && h < 48;
  }).length;

  return {
    lines: buildProgressCoachLines(params.facts, params.retrieved),
    completedAssignments: params.facts.completedAssignments,
    approvalRate: params.facts.approvalRate,
    trustScore: params.facts.trustScore,
    earningsThisWeekMinor: params.facts.earningsThisWeekMinor,
    upcomingDeadlines,
    avgReviewHours: params.facts.avgReviewHours,
    avgPaymentHours: params.facts.avgPaymentHours,
  };
}

export { buildProgressCoachLines };
