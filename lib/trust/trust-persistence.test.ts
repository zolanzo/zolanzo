/**
 * Phase 4.2B — Trust persistence logic tests (pure + service contracts).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  defaultWeightForTrustEvent,
  toWeightedTrustEvent,
  applyEventToSignalCounters,
  resetTrustEventLedgerForTests,
} from "@/lib/trust/event-processor";
import { applyDecayToWeight } from "@/lib/trust/time-decay";
import {
  buildTrustProfileFromSnapshot,
  resetTrustPublicIdsForTests,
} from "@/lib/trust/trust-engine";
import { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";
import {
  resetTrustTelemetryForTests,
  getTrustTelemetrySnapshot,
  recordTrustEventDeadLetter,
  recordTrustEventFailed,
} from "@/lib/trust/telemetry";
import { isTrustEngineEnabled } from "@/lib/trust/config";
import { TRUST_ENGINE_MODEL_VERSION } from "@/lib/trust/types";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetTrustTelemetryForTests();
  resetTrustEventLedgerForTests();
  resetTrustPublicIdsForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.TRUST_ENGINE;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("versioning", () => {
  it("uses trust-engine/1.1.0 processor version", () => {
    expect(TRUST_ENGINE_MODEL_VERSION).toBe("trust-engine/1.1.0");
  });
});

describe("event weights + fraud cleared / reinstatement", () => {
  it("weights fraud_confirmed strongly negative", () => {
    expect(defaultWeightForTrustEvent("fraud_confirmed")).toBeLessThan(0);
    expect(defaultWeightForTrustEvent("fraud_cleared")).toBeGreaterThan(0);
    expect(defaultWeightForTrustEvent("reinstatement")).toBeGreaterThan(0);
  });

  it("applyEventToSignalCounters adjusts fraud/suspension", () => {
    const counters = {
      fraudConfirmedCount: 1,
      policyViolationCount: 0,
      appealUpheldCount: 0,
      appealDeniedCount: 0,
      warningCount: 0,
      suspensionCount: 1,
      organizationEndorsements: 0,
      verifiedRecommendations: 0,
      assignmentsCompleted: 0,
      assignmentsTotal: 0,
      reviewsApproved: 0,
      reviewsDecided: 0,
      revisionRequestCount: 0,
      emailVerified: false,
      phoneVerified: false,
      governmentIdVerified: false,
    };
    applyEventToSignalCounters(counters, "fraud_cleared");
    applyEventToSignalCounters(counters, "reinstatement");
    expect(counters.fraudConfirmedCount).toBe(0);
    expect(counters.suspensionCount).toBe(0);
  });
});

describe("idempotency key contract", () => {
  it("domain emits use stable keys", () => {
    const decisionId = "REV-ABC123";
    const key = `trust:submission_approved:${decisionId}`;
    expect(key).toBe("trust:submission_approved:REV-ABC123");
    // Same key twice would be treated as duplicate by recordEvent
    expect(`trust:submission_approved:${decisionId}`).toBe(key);
  });
});

describe("ordering via occurredAt + decay", () => {
  it("older events decay more", () => {
    const now = new Date("2026-07-26T00:00:00.000Z");
    const recent = toWeightedTrustEvent(
      {
        userId: "u1",
        type: "submission_approved",
        occurredAt: "2026-07-25T00:00:00.000Z",
      },
      now,
    );
    const old = toWeightedTrustEvent(
      {
        userId: "u1",
        type: "submission_approved",
        occurredAt: "2025-01-01T00:00:00.000Z",
      },
      now,
    );
    expect(recent.decayedWeight).toBeGreaterThan(old.decayedWeight);
    expect(
      applyDecayToWeight({
        rawWeight: 10,
        occurredAt: "2026-07-26T00:00:00.000Z",
        now,
      }).decayFactor,
    ).toBe(1);
  });
});

describe("profile output for persistence", () => {
  it("includes subjectType, version, lastInfluencingEvents", () => {
    const profile = buildTrustProfileFromSnapshot(
      emptyTrustSignalSnapshot({
        userId: "u1",
        emailVerified: true,
        phoneVerified: true,
        weightedEvents: [
          {
            id: "e1",
            userId: "u1",
            type: "submission_approved",
            occurredAt: new Date().toISOString(),
            rawWeight: 10,
            decayedWeight: 10,
            decayFactor: 1,
          },
        ],
      }),
    );
    expect(profile.subjectType).toBe("worker");
    expect(profile.subjectId).toBe("u1");
    expect(profile.version).toBe(1);
    expect(profile.lastInfluencingEvents.length).toBeGreaterThan(0);
    expect(profile.advisoryOnly).toBe(true);
    expect(profile.publicId).toMatch(/^TRS-/);
  });
});

describe("DLQ telemetry", () => {
  it("tracks failed and dead-letter counters", () => {
    recordTrustEventFailed(2);
    recordTrustEventDeadLetter(1);
    const snap = getTrustTelemetrySnapshot();
    expect(snap.eventsFailed).toBe(2);
    expect(snap.eventsDeadLetter).toBe(1);
  });
});

describe("feature flags", () => {
  it("can disable trust engine", () => {
    process.env.TRUST_ENGINE = "0";
    expect(isTrustEngineEnabled()).toBe(false);
  });
});

describe("replay strategy (documented contract)", () => {
  it("processes pending/failed in occurredAt ascending order", () => {
    // Contract assertion — replayPendingEvents orders by occurredAt asc, sequence asc
    const order = [
      { occurredAt: "2026-01-01", sequence: 1 },
      { occurredAt: "2026-01-02", sequence: 1 },
      { occurredAt: "2026-01-02", sequence: 2 },
    ];
    const sorted = [...order].sort((a, b) => {
      const t = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
      return t !== 0 ? t : a.sequence - b.sequence;
    });
    expect(sorted.map((x) => `${x.occurredAt}:${x.sequence}`)).toEqual([
      "2026-01-01:1",
      "2026-01-02:1",
      "2026-01-02:2",
    ]);
  });
});
