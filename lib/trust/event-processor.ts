/**
 * TrustEventProcessor — apply domain trust events, then recalculate.
 * Does not mutate business tables; updates trust profile via TrustProfileService.
 */

import { applyDecayToWeight } from "@/lib/trust/time-decay";
import type {
  TrustEventType,
  TrustWeightedEvent,
} from "@/lib/trust/types";

export type IncomingTrustEvent = {
  id?: string;
  userId: string;
  type: TrustEventType;
  occurredAt?: string;
  payload?: Record<string, unknown>;
  /** Override raw weight; otherwise derived from type */
  rawWeight?: number;
};

const DEFAULT_WEIGHTS: Record<TrustEventType, number> = {
  assignment_completed: 8,
  assignment_expired: -6,
  assignment_accepted: 2,
  submission_approved: 10,
  submission_rejected: -8,
  submission_revision_requested: -4,
  review_completed: 1,
  payment_settled: 3,
  fraud_confirmed: -40,
  fraud_cleared: 25,
  appeal_upheld: 8,
  appeal_denied: -3,
  appeal_resolved: 2,
  identity_verified: 15,
  email_verified: 8,
  phone_verified: 8,
  organization_endorsement: 12,
  policy_violation: -15,
  warning_issued: -5,
  suspension: -30,
  reinstatement: 20,
  recalculation: 0,
  bootstrap: 0,
};

/** Process-local event ledger (not business data). */
const eventsByUser = new Map<string, TrustWeightedEvent[]>();
const MAX_EVENTS_PER_USER = 200;

let eventSeq = 0;

export function defaultWeightForTrustEvent(type: TrustEventType): number {
  return DEFAULT_WEIGHTS[type] ?? 0;
}

export function toWeightedTrustEvent(
  event: IncomingTrustEvent,
  now: Date = new Date(),
): TrustWeightedEvent {
  const rawWeight =
    event.rawWeight ?? defaultWeightForTrustEvent(event.type);
  const occurredAt = event.occurredAt ?? now.toISOString();
  const { decayedWeight, decayFactor } = applyDecayToWeight({
    rawWeight,
    occurredAt,
    now,
  });
  eventSeq += 1;
  return {
    id: event.id ?? `tevt_${eventSeq}`,
    userId: event.userId,
    type: event.type,
    occurredAt,
    rawWeight,
    decayedWeight,
    decayFactor,
    payload: event.payload,
  };
}

export function appendTrustEvent(
  event: IncomingTrustEvent,
  now: Date = new Date(),
): TrustWeightedEvent {
  const weighted = toWeightedTrustEvent(event, now);
  const list = eventsByUser.get(event.userId) ?? [];
  list.push(weighted);
  eventsByUser.set(event.userId, list.slice(-MAX_EVENTS_PER_USER));
  return weighted;
}

export function listTrustEvents(userId: string): TrustWeightedEvent[] {
  return [...(eventsByUser.get(userId) ?? [])];
}

export function refreshDecayedEvents(
  userId: string,
  now: Date = new Date(),
): TrustWeightedEvent[] {
  const refreshed = listTrustEvents(userId).map((e) => {
    const { decayedWeight, decayFactor } = applyDecayToWeight({
      rawWeight: e.rawWeight,
      occurredAt: e.occurredAt,
      now,
    });
    return { ...e, decayedWeight, decayFactor };
  });
  eventsByUser.set(userId, refreshed);
  return refreshed;
}

/**
 * Apply event effects onto a mutable signal counter bag (pure-ish merge).
 */
export function applyEventToSignalCounters(
  counters: {
    fraudConfirmedCount: number;
    policyViolationCount: number;
    appealUpheldCount: number;
    appealDeniedCount: number;
    warningCount: number;
    suspensionCount: number;
    organizationEndorsements: number;
    verifiedRecommendations: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    reviewsApproved: number;
    reviewsDecided: number;
    revisionRequestCount: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    governmentIdVerified: boolean;
  },
  type: TrustEventType,
): void {
  switch (type) {
    case "assignment_completed":
      counters.assignmentsCompleted += 1;
      counters.assignmentsTotal += 1;
      break;
    case "assignment_expired":
      counters.assignmentsTotal += 1;
      break;
    case "submission_approved":
      counters.reviewsApproved += 1;
      counters.reviewsDecided += 1;
      break;
    case "submission_rejected":
      counters.reviewsDecided += 1;
      break;
    case "submission_revision_requested":
      counters.revisionRequestCount += 1;
      counters.reviewsDecided += 1;
      break;
    case "fraud_confirmed":
      counters.fraudConfirmedCount += 1;
      break;
    case "fraud_cleared":
      counters.fraudConfirmedCount = Math.max(
        0,
        counters.fraudConfirmedCount - 1,
      );
      break;
    case "policy_violation":
      counters.policyViolationCount += 1;
      break;
    case "appeal_upheld":
      counters.appealUpheldCount += 1;
      break;
    case "appeal_denied":
      counters.appealDeniedCount += 1;
      break;
    case "warning_issued":
      counters.warningCount += 1;
      break;
    case "suspension":
      counters.suspensionCount += 1;
      break;
    case "reinstatement":
      counters.suspensionCount = Math.max(0, counters.suspensionCount - 1);
      break;
    case "organization_endorsement":
      counters.organizationEndorsements += 1;
      break;
    case "email_verified":
      counters.emailVerified = true;
      break;
    case "phone_verified":
      counters.phoneVerified = true;
      break;
    case "identity_verified":
      counters.governmentIdVerified = true;
      break;
    default:
      break;
  }
}

export function resetTrustEventLedgerForTests(): void {
  eventsByUser.clear();
  eventSeq = 0;
}
