/**
 * Phase 4.2C — Trust Passport tests.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTrustPassport } from "@/lib/trust/passport/passport-builder";
import { buildPassportBadges } from "@/lib/trust/passport/badge-engine";
import { buildPassportGuidance } from "@/lib/trust/passport/guidance-builder";
import { buildPassportTimeline } from "@/lib/trust/passport/timeline-builder";
import { applyPassportVisibility } from "@/lib/trust/passport/visibility-filter";
import {
  isTrustPassportEnabled,
  isTrustBadgesEnabled,
  isTrustTimelineEnabled,
} from "@/lib/trust/passport/config";
import {
  getPassportTelemetrySnapshot,
  resetPassportTelemetryForTests,
  recordPassportGeneration,
} from "@/lib/trust/passport/passport-telemetry";
import type { PassportBuildInput } from "@/lib/trust/passport/types";
import type { TrustProfile } from "@/lib/trust/types";

const ORIGINAL_ENV = { ...process.env };

function profile(overrides: Partial<TrustProfile> = {}): TrustProfile {
  return {
    userId: "u1",
    publicId: "TRS-TEST01",
    subjectKind: "worker",
    subjectType: "worker",
    subjectId: "u1",
    overallScore: 91,
    dimensions: {
      identity: 98,
      reliability: 94,
      quality: 90,
      behavior: 100,
      experience: 82,
      reputation: 69,
    },
    dimensionDetails: [
      {
        dimension: "identity",
        score: 98,
        weight: 0.2,
        contributors: [
          { code: "email_verified", label: "Email verified", delta: 25 },
        ],
      },
    ],
    trend: "improving",
    trendDelta: 4,
    reasons: ["Excellent completion history", "No fraud incidents"],
    warnings: [],
    lastInfluencingEvents: [
      {
        eventType: "submission_approved",
        occurredAt: new Date().toISOString(),
        decayedWeight: 10,
      },
    ],
    modelVersion: "trust-engine/1.1.0",
    version: 3,
    calculatedAt: new Date().toISOString(),
    lastEventAt: new Date().toISOString(),
    advisoryOnly: true,
    ...overrides,
  };
}

function input(overrides: Partial<PassportBuildInput> = {}): PassportBuildInput {
  return {
    profile: profile(),
    displayName: "Ada",
    identity: {
      emailVerified: true,
      phoneVerified: true,
      governmentIdVerified: true,
      organizationVerified: false,
    },
    stats: {
      assignmentsCompleted: 120,
      accountAgeDays: 400,
      approvalRate: 0.96,
      organizationEndorsements: 2,
      revisionRequestCount: 1,
      fraudConfirmedCount: 0,
      distinctOrganizations: 6,
    },
    history: [
      {
        overallScore: 91,
        calculatedAt: new Date().toISOString(),
        trend: "improving",
      },
      {
        overallScore: 85,
        calculatedAt: new Date(Date.now() - 86_400_000).toISOString(),
        trend: "stable",
      },
    ],
    events: [
      {
        eventType: "identity_verified",
        occurredAt: new Date(Date.now() - 3_600_000).toISOString(),
        decayedWeight: 15,
      },
      {
        eventType: "organization_endorsement",
        occurredAt: new Date(Date.now() - 7_200_000).toISOString(),
        decayedWeight: 12,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  resetPassportTelemetryForTests();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.TRUST_PASSPORT;
  delete process.env.TRUST_BADGES;
  delete process.env.TRUST_TIMELINE;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("feature flags", () => {
  it("defaults passport flags on", () => {
    expect(isTrustPassportEnabled()).toBe(true);
    expect(isTrustBadgesEnabled()).toBe(true);
    expect(isTrustTimelineEnabled()).toBe(true);
  });

  it("respects TRUST_PASSPORT=0", () => {
    process.env.TRUST_PASSPORT = "0";
    expect(isTrustPassportEnabled()).toBe(false);
    const p = buildTrustPassport(input());
    expect(p.guidance[0]).toMatch(/disabled/i);
  });
});

describe("passport generation", () => {
  it("builds sections from TrustProfile without changing scores", () => {
    const p = buildTrustPassport(input(), "private");
    expect(p.summary.overallScore).toBe(91);
    expect(p.summary.trend).toBe("improving");
    expect(p.dimensions).toHaveLength(6);
    expect(p.achievements.some((a) => a.code === "assignments_100" && a.earned)).toBe(
      true,
    );
    expect(p.advisoryOnly).toBe(true);
    expect(p.sourceProfileVersion).toBe(3);
  });
});

describe("badge generation", () => {
  it("earns verified and high-trust badges", () => {
    const badges = buildPassportBadges(input());
    expect(badges.find((b) => b.code === "verified_identity")?.earned).toBe(true);
    expect(badges.find((b) => b.code === "trusted_worker")?.earned).toBe(true);
    expect(badges.find((b) => b.code === "zero_fraud")?.earned).toBe(true);
    expect(badges.find((b) => b.code === "high_approval")?.earned).toBe(true);
  });

  it("returns empty when TRUST_BADGES=0", () => {
    process.env.TRUST_BADGES = "0";
    expect(buildPassportBadges(input())).toEqual([]);
  });
});

describe("timeline ordering", () => {
  it("orders newest first", () => {
    const timeline = buildPassportTimeline(input());
    expect(timeline.length).toBeGreaterThan(0);
    for (let i = 1; i < timeline.length; i += 1) {
      expect(Date.parse(timeline[i - 1]!.occurredAt)).toBeGreaterThanOrEqual(
        Date.parse(timeline[i]!.occurredAt),
      );
    }
  });

  it("hides timeline when disabled", () => {
    process.env.TRUST_TIMELINE = "false";
    expect(buildPassportTimeline(input())).toEqual([]);
  });
});

describe("guidance generation", () => {
  it("uses engine warnings and actionable tips", () => {
    const tips = buildPassportGuidance(
      input({
        profile: profile({
          warnings: ["Complete identity verification to improve trust"],
          dimensions: {
            identity: 20,
            reliability: 50,
            quality: 50,
            behavior: 100,
            experience: 30,
            reputation: 40,
          },
        }),
        identity: {
          emailVerified: false,
          phoneVerified: false,
          governmentIdVerified: false,
          organizationVerified: false,
        },
        stats: {
          assignmentsCompleted: 2,
          accountAgeDays: 10,
          approvalRate: 0.7,
          organizationEndorsements: 0,
          revisionRequestCount: 3,
          fraudConfirmedCount: 0,
          distinctOrganizations: 1,
        },
      }),
    );
    expect(tips.some((t) => /verification|identity/i.test(t))).toBe(true);
  });
});

describe("visibility filtering", () => {
  it("strips sensitive fields from public view", () => {
    const full = buildTrustPassport(input(), "private");
    const pub = applyPassportVisibility(full, "public");
    expect(pub.visibility).toBe("public");
    expect(pub.warnings).toEqual([]);
    expect(pub.guidance).toEqual([]);
    expect(pub.timeline).toEqual([]);
    expect(pub.reasons).toEqual([]);
    expect(pub.summary.overallScore).toBe(91);
    expect(pub.badges.every((b) => b.earned)).toBe(true);
  });

  it("keeps org view richer than public", () => {
    const full = buildTrustPassport(input(), "private");
    const org = applyPassportVisibility(full, "organization");
    expect(org.guidance.length).toBeGreaterThan(0);
    expect(org.timeline.length).toBeGreaterThan(0);
  });
});

describe("telemetry", () => {
  it("records generation metrics", () => {
    recordPassportGeneration({
      success: true,
      latencyMs: 12,
      visibility: "private",
      badgesEarned: ["trusted_worker"],
      timelineCount: 3,
    });
    const snap = getPassportTelemetrySnapshot();
    expect(snap.generated).toBe(1);
    expect(snap.badgeEarnCounts.trusted_worker).toBe(1);
    expect(snap.timelineEventsEmitted).toBe(3);
  });
});
