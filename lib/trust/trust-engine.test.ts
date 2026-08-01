/**
 * Phase 4.2A — Trust & Reputation Foundation tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  calculateTrustScores,
  calculateIdentityScore,
  calculateBehaviorScore,
} from "@/lib/trust/calculator";
import {
  isTrustEngineEnabled,
  isTrustExplainabilityEnabled,
  isTrustTrendsEnabled,
} from "@/lib/trust/config";
import { trustDecayFactor, applyDecayToWeight } from "@/lib/trust/time-decay";
import { analyzeTrustTrend } from "@/lib/trust/trend-analyzer";
import { buildTrustExplanation } from "@/lib/trust/explanation-builder";
import {
  processTrustEvent,
  recalculateTrustProfile,
  getTrustProfile,
  resetTrustProfileCacheForTests,
} from "@/lib/trust/profile-service";
import {
  resetTrustEventLedgerForTests,
  toWeightedTrustEvent,
} from "@/lib/trust/event-processor";
import {
  getTrustTelemetrySnapshot,
  resetTrustTelemetryForTests,
} from "@/lib/trust/telemetry";
import { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";
import { resetTrustPublicIdsForTests } from "@/lib/trust/trust-engine";
import { resolveOverallTrustScore } from "@/lib/trust/legacy-bridge";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetTrustTelemetryForTests();
  resetTrustEventLedgerForTests();
  resetTrustProfileCacheForTests();
  resetTrustPublicIdsForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.TRUST_ENGINE;
  delete process.env.TRUST_EXPLAINABILITY;
  delete process.env.TRUST_TRENDS;
  delete process.env.TRUST_DECAY_HALF_LIFE_DAYS;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults trust flags on", () => {
    expect(isTrustEngineEnabled()).toBe(true);
    expect(isTrustExplainabilityEnabled()).toBe(true);
    expect(isTrustTrendsEnabled()).toBe(true);
  });

  it("respects TRUST_ENGINE=0", () => {
    process.env.TRUST_ENGINE = "0";
    expect(isTrustEngineEnabled()).toBe(false);
  });
});

describe("time decay", () => {
  it("is 1 at age 0 and ~0.5 at half-life", () => {
    expect(trustDecayFactor(0, 90)).toBe(1);
    expect(trustDecayFactor(90, 90)).toBeCloseTo(0.5, 5);
  });

  it("decays older event weights", () => {
    const now = new Date("2026-07-26T00:00:00.000Z");
    const recent = applyDecayToWeight({
      rawWeight: 10,
      occurredAt: "2026-07-20T00:00:00.000Z",
      now,
      halfLifeDays: 90,
    });
    const old = applyDecayToWeight({
      rawWeight: 10,
      occurredAt: "2025-07-26T00:00:00.000Z",
      now,
      halfLifeDays: 90,
    });
    expect(recent.decayedWeight).toBeGreaterThan(old.decayedWeight);
  });
});

describe("dimension calculation", () => {
  it("scores identity from verification flags", () => {
    const snap = emptyTrustSignalSnapshot({
      userId: "u1",
      emailVerified: true,
      phoneVerified: true,
      governmentIdVerified: true,
    });
    const identity = calculateIdentityScore(snap);
    expect(identity.score).toBe(80);
  });

  it("starts behavior near 100 without incidents", () => {
    const snap = emptyTrustSignalSnapshot({ userId: "u1" });
    expect(calculateBehaviorScore(snap).score).toBe(100);
  });

  it("penalizes fraud on behavior", () => {
    const snap = emptyTrustSignalSnapshot({
      userId: "u1",
      fraudConfirmedCount: 1,
    });
    expect(calculateBehaviorScore(snap).score).toBe(60);
  });
});

describe("overall score calculation", () => {
  it("produces higher score for strong verified worker", () => {
    const weak = calculateTrustScores(
      emptyTrustSignalSnapshot({ userId: "w" }),
    );
    const strong = calculateTrustScores(
      emptyTrustSignalSnapshot({
        userId: "s",
        emailVerified: true,
        phoneVerified: true,
        governmentIdVerified: true,
        assignmentsTotal: 40,
        assignmentsCompleted: 38,
        assignmentsAccepted: 40,
        assignmentsOffered: 40,
        deadlineMetRate: 0.95,
        attendanceRate: 0.95,
        reviewsDecided: 30,
        reviewsApproved: 28,
        accountAgeDays: 200,
        distinctCampaigns: 8,
        distinctOrganizations: 4,
        organizationEndorsements: 2,
      }),
    );
    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
    expect(strong.overallScore).toBeGreaterThanOrEqual(70);
  });
});

describe("trend analysis", () => {
  it("detects improving vs declining", () => {
    expect(
      analyzeTrustTrend({ currentOverall: 80, previousOverall: 70 }).trend,
    ).toBe("improving");
    expect(
      analyzeTrustTrend({ currentOverall: 60, previousOverall: 75 }).trend,
    ).toBe("declining");
    expect(
      analyzeTrustTrend({ currentOverall: 70, previousOverall: 71 }).trend,
    ).toBe("stable");
  });

  it("returns unknown when trends disabled", () => {
    process.env.TRUST_TRENDS = "0";
    expect(
      analyzeTrustTrend({ currentOverall: 80, previousOverall: 50 }).trend,
    ).toBe("unknown");
  });
});

describe("explainability", () => {
  it("returns reasons when enabled", () => {
    const scores = calculateTrustScores(
      emptyTrustSignalSnapshot({
        userId: "u1",
        emailVerified: true,
        phoneVerified: true,
        reviewsDecided: 20,
        reviewsApproved: 18,
        assignmentsCompleted: 15,
        assignmentsTotal: 16,
      }),
    );
    const { reasons } = buildTrustExplanation({
      overallScore: scores.overallScore,
      dimensionDetails: scores.dimensionDetails,
      trend: "improving",
    });
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some((r) => /trust|verif|approval|completion/i.test(r))).toBe(
      true,
    );
  });

  it("collapses reasons when explainability off", () => {
    process.env.TRUST_EXPLAINABILITY = "0";
    const scores = calculateTrustScores(
      emptyTrustSignalSnapshot({ userId: "u1", emailVerified: true }),
    );
    const { reasons } = buildTrustExplanation({
      overallScore: scores.overallScore,
      dimensionDetails: scores.dimensionDetails,
      trend: "stable",
    });
    expect(reasons).toHaveLength(1);
  });
});

describe("event processing", () => {
  it("processes events and recalculates profile", () => {
    const base = emptyTrustSignalSnapshot({
      userId: "u1",
      emailVerified: true,
      assignmentsCompleted: 5,
      assignmentsTotal: 5,
      reviewsDecided: 5,
      reviewsApproved: 5,
    });
    recalculateTrustProfile(base);
    const afterFraud = processTrustEvent({
      userId: "u1",
      type: "fraud_confirmed",
    });
    expect(afterFraud.dimensions.behavior).toBeLessThan(100);
    expect(afterFraud.advisoryOnly).toBe(true);
    expect(getTrustTelemetrySnapshot().eventsProcessed).toBe(1);
  });

  it("weights recent events more via decay", () => {
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
  });
});

describe("profile service + flags", () => {
  it("returns disabled profile when TRUST_ENGINE=0", () => {
    process.env.TRUST_ENGINE = "false";
    const profile = getTrustProfile({ userId: "u1" });
    expect(profile.overallScore).toBe(0);
    expect(profile.reasons[0]).toMatch(/disabled/i);
  });

  it("exposes publicId and dimensions", () => {
    const profile = recalculateTrustProfile(
      emptyTrustSignalSnapshot({
        userId: "u1",
        emailVerified: true,
        phoneVerified: true,
      }),
    );
    expect(profile.publicId).toMatch(/^TRS-/);
    expect(profile.dimensions.identity).toBeGreaterThan(0);
    expect(getTrustTelemetrySnapshot().recalculations).toBeGreaterThan(0);
  });
});

describe("legacy bridge", () => {
  it("matches heuristic when engine off", () => {
    process.env.TRUST_ENGINE = "0";
    const score = resolveOverallTrustScore({
      userId: "u1",
      emailVerified: true,
      phoneVerified: true,
      approvalRate: 0.8,
      completionRate: 0.9,
      completedAssignments: 10,
      totalAssignments: 12,
    });
    expect(score).toBe(
      Math.min(100, Math.round(40 + 10 + 10 + 0.8 * 25 + 0.9 * 15)),
    );
  });
});
