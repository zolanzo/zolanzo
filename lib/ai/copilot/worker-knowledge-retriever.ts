/**
 * Worker knowledge retrieval — worker-scoped facts only.
 */

import type {
  WorkerAssignmentFact,
  WorkerCopilotIntent,
  WorkerKnowledgeFacts,
} from "@/lib/ai/copilot/worker-types";

export type WorkerRetrievedKnowledge = {
  intent: WorkerCopilotIntent;
  dataSources: string[];
  assignments: WorkerAssignmentFact[];
  findings: string[];
  metrics: Record<string, number | string>;
};

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (t - Date.now()) / 3_600_000;
}

function isOpen(a: WorkerAssignmentFact): boolean {
  return ![
    "completed",
    "cancelled",
    "expired",
    "rejected",
    "approved",
  ].includes(a.status);
}

export function retrieveWorkerKnowledge(params: {
  intent: WorkerCopilotIntent;
  facts: WorkerKnowledgeFacts;
}): WorkerRetrievedKnowledge {
  const { intent, facts } = params;
  const open = facts.assignments.filter(isOpen);
  const findings: string[] = [];
  const dataSources: string[] = ["worker_self"];
  const metrics: Record<string, number | string> = {
    openAssignments: open.length,
    completed: facts.completedAssignments,
  };

  switch (intent) {
    case "my_assignments": {
      dataSources.push("assignments");
      for (const a of open.slice(0, 8)) {
        findings.push(
          `${a.publicId} · ${a.campaignName} · ${a.status} · ${(a.rewardMinor / 100).toFixed(0)} ${a.currency}`,
        );
      }
      if (findings.length === 0) findings.push("No open assignments right now.");
      return {
        intent,
        dataSources,
        assignments: open,
        findings,
        metrics,
      };
    }
    case "next_best_task": {
      dataSources.push("assignments");
      const ranked = [...open].sort((a, b) => {
        const ah = hoursUntil(a.expiresAt) ?? 999;
        const bh = hoursUntil(b.expiresAt) ?? 999;
        // Prefer expiring soon, then higher pay, then higher progress
        return ah - bh || b.rewardMinor - a.rewardMinor || b.progressPercent - a.progressPercent;
      });
      const best = ranked[0];
      if (best) {
        const hrs = hoursUntil(best.expiresAt);
        findings.push(
          `Best next: ${best.publicId} (${best.campaignName}) — ${(best.rewardMinor / 100).toFixed(0)} ${best.currency}` +
            (hrs != null && hrs < 48 ? ` · expires in ~${Math.max(0, Math.round(hrs))}h` : ""),
        );
      } else {
        findings.push("No open assignments to prioritize.");
      }
      return {
        intent,
        dataSources,
        assignments: ranked.slice(0, 5),
        findings,
        metrics,
      };
    }
    case "highest_pay_today": {
      dataSources.push("assignments");
      const byPay = [...open].sort((a, b) => b.rewardMinor - a.rewardMinor);
      for (const a of byPay.slice(0, 5)) {
        findings.push(
          `${a.publicId}: ${(a.rewardMinor / 100).toFixed(0)} ${a.currency}`,
        );
      }
      return {
        intent,
        dataSources,
        assignments: byPay,
        findings,
        metrics: {
          ...metrics,
          topPayMinor: byPay[0]?.rewardMinor ?? 0,
        },
      };
    }
    case "nearby_work": {
      dataSources.push("assignments", "location");
      const nearby = [...open].sort((a, b) => a.distanceScore - b.distanceScore);
      for (const a of nearby.slice(0, 5)) {
        findings.push(
          `${a.publicId}: ${a.campaignName}` +
            (a.countryCode ? ` · ${a.countryCode}` : "") +
            (a.distanceScore <= 0.25 ? " · nearby" : ""),
        );
      }
      return {
        intent,
        dataSources,
        assignments: nearby,
        findings,
        metrics,
      };
    }
    case "deadlines": {
      dataSources.push("assignments");
      const soon = [...open]
        .filter((a) => a.expiresAt)
        .sort(
          (a, b) =>
            (hoursUntil(a.expiresAt) ?? 999) - (hoursUntil(b.expiresAt) ?? 999),
        );
      for (const a of soon.slice(0, 5)) {
        const hrs = hoursUntil(a.expiresAt);
        findings.push(
          `${a.publicId}: ~${hrs != null ? Math.max(0, Math.round(hrs)) : "?"}h remaining`,
        );
      }
      if (findings.length === 0) findings.push("No upcoming deadlines on open assignments.");
      return {
        intent,
        dataSources,
        assignments: soon,
        findings,
        metrics,
      };
    }
    case "missing_evidence":
    case "assignment_coach": {
      dataSources.push("assignments", "evidence");
      const focus =
        open.find((a) => a.presentEvidenceKinds.length < a.requiredEvidenceKinds.length) ??
        open[0];
      if (!focus) {
        findings.push("No active assignment to coach.");
        return { intent, dataSources, assignments: [], findings, metrics };
      }
      const missing = focus.requiredEvidenceKinds.filter(
        (k) => !focus.presentEvidenceKinds.includes(k),
      );
      findings.push(`Assignment ${focus.publicId}`);
      findings.push(
        `Evidence: ${focus.presentEvidenceKinds.length}/${focus.requiredEvidenceKinds.length} present`,
      );
      if (missing.length) findings.push(`Missing: ${missing.join(", ")}`);
      if (focus.gpsRequired) {
        findings.push(
          focus.gpsSatisfied
            ? "GPS: inside required area"
            : focus.gpsSatisfied === false
              ? "GPS: outside required area"
              : "GPS: required (status unknown)",
        );
      }
      const hrs = hoursUntil(focus.expiresAt);
      if (hrs != null) findings.push(`Time remaining: ~${Math.max(0, Math.round(hrs))}h`);
      findings.push(`Progress: ${focus.progressPercent}%`);
      return {
        intent,
        dataSources,
        assignments: [focus],
        findings,
        metrics: { ...metrics, missingCount: missing.length },
      };
    }
    case "rejection_reason": {
      dataSources.push("submissions", "reviews");
      const rejected = facts.submissions.filter(
        (s) =>
          s.reviewOutcome === "rejected" ||
          s.status === "rejected" ||
          s.reviewOutcome === "revision_requested",
      );
      const last = rejected[0] ?? facts.assignments.find((a) => a.lastRejectionReason);
      if (last && "publicId" in last && "missingEvidence" in last) {
        findings.push(`Submission ${last.publicId}: ${last.reviewOutcome ?? last.status}`);
        if (last.missingEvidence.length) {
          findings.push(`Missing items noted: ${last.missingEvidence.join(", ")}`);
        }
      } else if (last && "lastRejectionReason" in last && last.lastRejectionReason) {
        findings.push(last.lastRejectionReason);
      } else {
        findings.push("No recent rejection details available on your account.");
      }
      return {
        intent,
        dataSources,
        assignments: facts.assignments.filter((a) => a.lastRejectionReason),
        findings,
        metrics,
      };
    }
    case "submission_status": {
      dataSources.push("submissions");
      for (const s of facts.submissions.slice(0, 5)) {
        findings.push(
          `${s.publicId}: ${s.status}` +
            (s.reviewOutcome ? ` · review ${s.reviewOutcome}` : ""),
        );
      }
      if (findings.length === 0) findings.push("No recent submissions.");
      return {
        intent,
        dataSources,
        assignments: [],
        findings,
        metrics,
      };
    }
    case "approval_history": {
      dataSources.push("reviews", "profile");
      findings.push(
        `Approval rate: ${Math.round(facts.approvalRate * 100)}% across ${facts.completedAssignments} completed`,
      );
      findings.push(`Trust score: ${facts.trustScore}`);
      return {
        intent,
        dataSources,
        assignments: [],
        findings,
        metrics: { approvalRate: facts.approvalRate, trustScore: facts.trustScore },
      };
    }
    case "trust_score": {
      dataSources.push("profile", "trust");
      findings.push(`Your trust score is ${facts.trustScore}/100.`);
      if (facts.trustTrend) findings.push(`Trend: ${facts.trustTrend}`);
      for (const r of facts.trustReasons.slice(0, 4)) findings.push(r);
      findings.push(
        facts.emailVerified && facts.phoneVerified
          ? "Contact channels verified."
          : "Verification incomplete — update documents/contacts.",
      );
      return {
        intent,
        dataSources,
        assignments: [],
        findings,
        metrics: { trustScore: facts.trustScore },
      };
    }
    case "improvement_tips": {
      dataSources.push("reviews", "profile", "trust");
      findings.push(
        `Approval rate: ${Math.round(facts.approvalRate * 100)}% across ${facts.completedAssignments} completed`,
      );
      findings.push(`Trust score: ${facts.trustScore}`);
      if (facts.trustTrend) findings.push(`Trust trend: ${facts.trustTrend}`);
      for (const r of facts.trustReasons.slice(0, 3)) findings.push(r);
      const lowered = facts.trustLastEvents.filter((e) => e.decayedWeight < 0);
      if (lowered.length) {
        findings.push(
          `Recent events that lowered score: ${lowered
            .slice(0, 3)
            .map((e) => e.eventType)
            .join(", ")}`,
        );
      }
      if (facts.approvalRate < 0.8) {
        findings.push("Tip: Double-check required evidence before submit.");
      }
      if (!facts.emailVerified || !facts.phoneVerified) {
        findings.push("Tip: Complete contact verification to improve trust.");
      }
      for (const w of facts.trustWarnings.slice(0, 2)) findings.push(w);
      return {
        intent,
        dataSources,
        assignments: [],
        findings,
        metrics: { approvalRate: facts.approvalRate, trustScore: facts.trustScore },
      };
    }
    case "weekly_earnings": {
      dataSources.push("wallet", "settlements");
      findings.push(
        `This week: ${(facts.earningsThisWeekMinor / 100).toFixed(2)} ${facts.currency}`,
      );
      if (facts.avgPaymentHours != null) {
        findings.push(`Avg payment time: ~${facts.avgPaymentHours.toFixed(1)}h`);
      }
      return {
        intent,
        dataSources,
        assignments: [],
        findings,
        metrics: { earningsThisWeekMinor: facts.earningsThisWeekMinor },
      };
    }
    case "payment_history": {
      dataSources.push("wallet", "payments");
      for (const p of facts.payments.slice(0, 6)) {
        findings.push(
          `${p.publicId}: ${p.status} · ${(p.amountMinor / 100).toFixed(2)} ${facts.currency}`,
        );
      }
      if (findings.length === 0) findings.push("No recent payments on your account.");
      return {
        intent,
        dataSources,
        assignments: [],
        findings,
        metrics,
      };
    }
    case "progress": {
      dataSources.push("assignments", "reviews", "wallet");
      findings.push(`Completed assignments: ${facts.completedAssignments}`);
      findings.push(`Approval rate: ${Math.round(facts.approvalRate * 100)}%`);
      findings.push(`Trust score: ${facts.trustScore}`);
      findings.push(
        `Earnings this week: ${(facts.earningsThisWeekMinor / 100).toFixed(2)} ${facts.currency}`,
      );
      if (facts.avgReviewHours != null) {
        findings.push(`Avg review time: ~${facts.avgReviewHours.toFixed(1)}h`);
      }
      const soon = open.filter((a) => {
        const h = hoursUntil(a.expiresAt);
        return h != null && h < 24;
      });
      if (soon.length) {
        findings.push(`Upcoming deadlines: ${soon.length} assignment(s) within 24h`);
      }
      return {
        intent,
        dataSources,
        assignments: open.slice(0, 3),
        findings,
        metrics,
      };
    }
    default: {
      findings.push(
        `Hi ${facts.displayName} — you have ${open.length} open assignment(s) and ${facts.completedAssignments} completed.`,
      );
      return {
        intent,
        dataSources,
        assignments: open.slice(0, 3),
        findings,
        metrics,
      };
    }
  }
}
