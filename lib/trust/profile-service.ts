/**
 * TrustProfileService — get / recalculate / process events.
 * Owns trust profile updates; never mutates wallets, reviews, or assignments.
 */

import { buildTrustProfileFromSnapshot } from "@/lib/trust/trust-engine";
import {
  appendTrustEvent,
  applyEventToSignalCounters,
  listTrustEvents,
  refreshDecayedEvents,
  type IncomingTrustEvent,
} from "@/lib/trust/event-processor";
import { recordTrustEventProcessed } from "@/lib/trust/telemetry";
import { isTrustEngineEnabled } from "@/lib/trust/config";
import { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";
import type { TrustProfile, TrustSignalSnapshot } from "@/lib/trust/types";

/** Process-local profile cache (foundation — not a domain table yet). */
const profiles = new Map<string, TrustProfile>();
/** Base signals last used (before event merges). */
const baseSignals = new Map<string, TrustSignalSnapshot>();

export function cacheTrustBaseSignals(snap: TrustSignalSnapshot): void {
  baseSignals.set(snap.userId, { ...snap, weightedEvents: [] });
}

function mergeSignalsWithEvents(
  base: TrustSignalSnapshot,
): TrustSignalSnapshot {
  const events = refreshDecayedEvents(base.userId);
  const counters = {
    fraudConfirmedCount: base.fraudConfirmedCount,
    policyViolationCount: base.policyViolationCount,
    appealUpheldCount: base.appealUpheldCount,
    appealDeniedCount: base.appealDeniedCount,
    warningCount: base.warningCount,
    suspensionCount: base.suspensionCount,
    organizationEndorsements: base.organizationEndorsements,
    verifiedRecommendations: base.verifiedRecommendations,
    assignmentsCompleted: base.assignmentsCompleted,
    assignmentsTotal: base.assignmentsTotal,
    reviewsApproved: base.reviewsApproved,
    reviewsDecided: base.reviewsDecided,
    revisionRequestCount: base.revisionRequestCount,
    emailVerified: base.emailVerified,
    phoneVerified: base.phoneVerified,
    governmentIdVerified: base.governmentIdVerified,
  };

  // Events are incremental on top of base — only apply events newer than base freeze
  // For foundation simplicity: re-apply all ledger events as soft increments only for
  // counts that are typically event-sourced (fraud, endorsements, warnings).
  for (const e of events) {
    if (
      e.type === "fraud_confirmed" ||
      e.type === "policy_violation" ||
      e.type === "warning_issued" ||
      e.type === "suspension" ||
      e.type === "organization_endorsement" ||
      e.type === "appeal_upheld" ||
      e.type === "appeal_denied" ||
      e.type === "email_verified" ||
      e.type === "phone_verified" ||
      e.type === "identity_verified"
    ) {
      applyEventToSignalCounters(counters, e.type);
    }
  }

  const previous = profiles.get(base.userId);

  return {
    ...base,
    ...counters,
    weightedEvents: events,
    previousOverallScore: previous?.overallScore ?? base.previousOverallScore,
    previousCalculatedAt:
      previous?.calculatedAt ?? base.previousCalculatedAt,
    frozenAt: new Date().toISOString(),
  };
}

export function recalculateTrustProfile(
  snap: TrustSignalSnapshot,
): TrustProfile {
  cacheTrustBaseSignals(snap);
  const merged = mergeSignalsWithEvents(snap);
  const profile = buildTrustProfileFromSnapshot(merged);
  profiles.set(snap.userId, profile);
  return profile;
}

export function getCachedTrustProfile(userId: string): TrustProfile | null {
  return profiles.get(userId) ?? null;
}

/**
 * Get profile from cache or compute from provided / empty signals.
 */
export function getTrustProfile(params: {
  userId: string;
  signals?: TrustSignalSnapshot;
}): TrustProfile {
  if (!isTrustEngineEnabled()) {
    return buildTrustProfileFromSnapshot(
      params.signals ??
        emptyTrustSignalSnapshot({ userId: params.userId }),
      { forceDisabled: true },
    );
  }

  const cached = profiles.get(params.userId);
  if (cached && !params.signals) return cached;

  const base =
    params.signals ??
    baseSignals.get(params.userId) ??
    emptyTrustSignalSnapshot({ userId: params.userId });

  return recalculateTrustProfile(base);
}

/**
 * Process a domain trust event through the trust service (not raw table writes).
 */
export function processTrustEvent(event: IncomingTrustEvent): TrustProfile {
  if (!isTrustEngineEnabled()) {
    return getTrustProfile({ userId: event.userId });
  }

  appendTrustEvent(event);
  recordTrustEventProcessed(1);

  const base =
    baseSignals.get(event.userId) ??
    emptyTrustSignalSnapshot({ userId: event.userId });

  return recalculateTrustProfile(base);
}

export function processTrustEvents(
  events: IncomingTrustEvent[],
): TrustProfile | null {
  if (events.length === 0) return null;
  let last: TrustProfile | null = null;
  for (const e of events) {
    last = processTrustEvent(e);
  }
  return last;
}

export function listCachedTrustProfiles(): TrustProfile[] {
  return [...profiles.values()];
}

export function resetTrustProfileCacheForTests(): void {
  profiles.clear();
  baseSignals.clear();
}

export { listTrustEvents };
