/**
 * AssignmentContextBuilder + ProgressAnalyzer — coach views for workers.
 */

import type {
  WorkerAssignmentFact,
  WorkerKnowledgeFacts,
} from "@/lib/ai/copilot/worker-types";
import type { WorkerRetrievedKnowledge } from "@/lib/ai/copilot/worker-knowledge-retriever";

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (t - Date.now()) / 3_600_000;
}

export function buildAssignmentCoachLines(
  assignment: WorkerAssignmentFact | undefined,
): string[] {
  if (!assignment) return ["No assignment selected for coaching."];

  const missing = assignment.requiredEvidenceKinds.filter(
    (k) => !assignment.presentEvidenceKinds.includes(k),
  );
  const photosRequired = assignment.requiredEvidenceKinds.filter(
    (k) => k === "image",
  ).length;
  const photosPresent = assignment.presentEvidenceKinds.filter(
    (k) => k === "image",
  ).length;
  const hrs = hoursUntil(assignment.expiresAt);
  const lines: string[] = [
    `Assignment ${assignment.publicId} · ${assignment.campaignName}`,
    `Checklist progress: ${assignment.progressPercent}%`,
    `Evidence required: ${assignment.requiredEvidenceKinds.join(", ") || "none specified"}`,
    `Evidence present: ${assignment.presentEvidenceKinds.join(", ") || "none"}`,
  ];

  if (assignment.gpsRequired) {
    lines.push(
      assignment.gpsSatisfied === true
        ? "GPS requirement: satisfied (inside radius)"
        : assignment.gpsSatisfied === false
          ? "GPS requirement: not satisfied"
          : "GPS requirement: required",
    );
  }

  if (photosRequired > 0) {
    lines.push(
      `Photos remaining: ${Math.max(0, photosRequired - photosPresent)}`,
    );
  }
  if (missing.length) lines.push(`Still missing: ${missing.join(", ")}`);
  if (hrs != null) {
    lines.push(`Time remaining: ~${Math.max(0, Math.round(hrs))}h`);
  }
  lines.push(
    `Completion estimate: ${
      missing.length === 0 && assignment.gpsSatisfied !== false
        ? "Ready to submit soon"
        : "Needs more evidence before submit"
    }`,
  );
  lines.push(
    "Common mistakes: blurry photos · GPS outside area · missing required files",
  );
  lines.push(
    missing.length === 0 && assignment.gpsSatisfied !== false
      ? "Ready to submit? Likely yes — review once more, then submit."
      : "Ready to submit? Not yet — finish missing items first.",
  );

  return lines;
}

export function buildProgressCoachLines(
  facts: WorkerKnowledgeFacts,
  retrieved: WorkerRetrievedKnowledge,
): string[] {
  const lines = [
    `Assignments completed: ${facts.completedAssignments}`,
    `Approval rate: ${Math.round(facts.approvalRate * 100)}%`,
    `Trust score: ${facts.trustScore}/100`,
    `Earnings this week: ${(facts.earningsThisWeekMinor / 100).toFixed(2)} ${facts.currency}`,
  ];
  if (facts.avgReviewHours != null) {
    lines.push(`Average review time: ~${facts.avgReviewHours.toFixed(1)}h`);
  }
  if (facts.avgPaymentHours != null) {
    lines.push(`Average payment time: ~${facts.avgPaymentHours.toFixed(1)}h`);
  }
  const deadlines = retrieved.assignments.filter((a) => {
    const h = hoursUntil(a.expiresAt);
    return h != null && h < 48;
  });
  if (deadlines.length) {
    lines.push(`Upcoming deadlines: ${deadlines.length}`);
  }
  if (facts.approvalRate < 0.85) {
    lines.push(
      "Suggested improvement: verify evidence completeness before every submit.",
    );
  }
  return lines;
}
