/**
 * TimelineBuilder — recent trust-related events for context.
 */

import { isTrustTimelineEnabled } from "@/lib/trust/passport/config";
import type {
  PassportBuildInput,
  PassportTimelineEvent,
} from "@/lib/trust/passport/types";

const LABELS: Record<string, { label: string; direction: PassportTimelineEvent["direction"] }> = {
  identity_verified: { label: "Identity verified", direction: "up" },
  email_verified: { label: "Email verified", direction: "up" },
  phone_verified: { label: "Phone verified", direction: "up" },
  submission_approved: {
    label: "Trust increased after approved submission",
    direction: "up",
  },
  submission_rejected: {
    label: "Trust decreased after rejection",
    direction: "down",
  },
  submission_revision_requested: {
    label: "Revision requested — trust pressure",
    direction: "down",
  },
  organization_endorsement: {
    label: "Organization endorsement received",
    direction: "up",
  },
  fraud_cleared: { label: "Fraud appeal cleared", direction: "up" },
  fraud_confirmed: { label: "Fraud confirmed", direction: "down" },
  appeal_upheld: { label: "Appeal upheld", direction: "up" },
  assignment_completed: {
    label: "Assignment completed",
    direction: "up",
  },
  payment_settled: { label: "Payment settled", direction: "up" },
  suspension: { label: "Account suspended", direction: "down" },
  reinstatement: { label: "Account reinstated", direction: "up" },
};

export function buildPassportTimeline(
  input: PassportBuildInput,
  enabled?: boolean,
): PassportTimelineEvent[] {
  if (!(enabled ?? isTrustTimelineEnabled())) return [];

  const fromEvents: PassportTimelineEvent[] = (input.events ?? [])
    .map((e) => {
      const meta = LABELS[e.eventType] ?? {
        label: e.eventType.replace(/_/g, " "),
        direction:
          (e.decayedWeight ?? 0) > 0
            ? ("up" as const)
            : (e.decayedWeight ?? 0) < 0
              ? ("down" as const)
              : ("neutral" as const),
      };
      return {
        code: e.eventType,
        label: meta.label,
        occurredAt: e.occurredAt,
        direction: meta.direction,
        eventType: e.eventType,
      };
    });

  // History milestones (approval / score jumps)
  const historyEvents: PassportTimelineEvent[] = [];
  const history = [...(input.history ?? [])].sort(
    (a, b) => Date.parse(b.calculatedAt) - Date.parse(a.calculatedAt),
  );
  for (let i = 0; i < history.length - 1 && historyEvents.length < 3; i += 1) {
    const cur = history[i]!;
    const prev = history[i + 1]!;
    const delta = cur.overallScore - prev.overallScore;
    if (Math.abs(delta) < 2) continue;
    historyEvents.push({
      code: delta > 0 ? "trust_increased" : "trust_decreased",
      label:
        delta > 0
          ? `Trust increased (+${delta})`
          : `Trust decreased (${delta})`,
      occurredAt: cur.calculatedAt,
      direction: delta > 0 ? "up" : "down",
      eventType: null,
    });
  }

  if (
    input.stats.approvalRate >= 0.95 &&
    input.stats.assignmentsCompleted >= 10
  ) {
    historyEvents.push({
      code: "approval_milestone",
      label: "Approval milestone — high approval rate",
      occurredAt: input.profile.calculatedAt,
      direction: "up",
      eventType: null,
    });
  }

  return [...fromEvents, ...historyEvents]
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 20);
}
