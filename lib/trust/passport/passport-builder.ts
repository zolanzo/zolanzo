/**
 * PassportBuilder — assemble Trust Passport from TrustProfile evidence.
 * Never calculates trust scores.
 */

import { bandForScore } from "@/lib/trust/explanation-builder";
import { buildPassportAchievements } from "@/lib/trust/passport/achievement-engine";
import { buildPassportBadges } from "@/lib/trust/passport/badge-engine";
import { buildPassportGuidance } from "@/lib/trust/passport/guidance-builder";
import { buildPassportTimeline } from "@/lib/trust/passport/timeline-builder";
import { applyPassportVisibility } from "@/lib/trust/passport/visibility-filter";
import {
  isTrustPassportEnabled,
  TRUST_PASSPORT_MODEL_VERSION,
} from "@/lib/trust/passport/config";
import type {
  PassportBuildInput,
  PassportDimensionView,
  PassportVisibility,
  TrustPassport,
} from "@/lib/trust/passport/types";
import type { TrustDimension } from "@/lib/trust/types";

const DIMENSION_COPY: Record<TrustDimension, (score: number) => string> = {
  identity: (s) =>
    s >= 80
      ? "Strong verification footprint"
      : s >= 50
        ? "Partial identity verification"
        : "Identity verification incomplete",
  reliability: (s) =>
    s >= 85
      ? "Excellent completion and deadline adherence"
      : s >= 65
        ? "Generally reliable with room to improve"
        : "On-time completion needs attention",
  quality: (s) =>
    s >= 85
      ? "High approval quality"
      : s >= 65
        ? "Solid quality with occasional revisions"
        : "Focus on reducing revisions and rejections",
  behavior: (s) =>
    s >= 95
      ? "Clean behavioral record"
      : s >= 70
        ? "Mostly clean with some flags"
        : "Behavioral issues affecting trust",
  experience: (s) =>
    s >= 70
      ? "Broad platform experience"
      : s >= 40
        ? "Building experience"
        : "Early in platform tenure",
  reputation: (s) =>
    s >= 70
      ? "Strong endorsements and reputation signals"
      : s >= 45
        ? "Reputation still forming"
        : "Limited reputation signals yet",
};

function verificationLevel(input: PassportBuildInput): string {
  if (input.identity.governmentIdVerified) return "identity";
  if (input.identity.organizationVerified) return "business";
  if (input.identity.phoneVerified) return "phone";
  if (input.identity.emailVerified) return "email";
  return "none";
}

function dimensionViews(input: PassportBuildInput): PassportDimensionView[] {
  const dims = input.profile.dimensions;
  const details = input.profile.dimensionDetails;
  return (Object.keys(dims) as TrustDimension[]).map((dimension) => {
    const score = dims[dimension];
    const detail = details.find((d) => d.dimension === dimension);
    const fromEngine = detail?.contributors[0]?.label;
    return {
      dimension,
      score,
      explanation: fromEngine ?? DIMENSION_COPY[dimension](score),
    };
  });
}

export function buildTrustPassport(
  input: PassportBuildInput,
  visibility: PassportVisibility = "private",
): TrustPassport {
  if (!isTrustPassportEnabled()) {
    return {
      subjectType: input.profile.subjectType,
      subjectId: input.profile.subjectId,
      profilePublicId: input.profile.publicId,
      displayName: input.displayName ?? null,
      visibility,
      identity: {
        emailVerified: false,
        phoneVerified: false,
        governmentIdVerified: false,
        organizationVerified: false,
        verificationLevel: "none",
        badges: [],
      },
      summary: {
        overallScore: 0,
        band: "Unknown",
        trend: "unknown",
        trendDelta: 0,
        lastUpdated: input.profile.calculatedAt,
      },
      dimensions: [],
      achievements: [],
      badges: [],
      guidance: ["Trust Passport is disabled."],
      timeline: [],
      reasons: [],
      warnings: [],
      modelVersion: TRUST_PASSPORT_MODEL_VERSION,
      generatedAt: new Date().toISOString(),
      sourceProfileVersion: input.profile.version,
      advisoryOnly: true,
    };
  }

  const badges = buildPassportBadges(input);
  const identityBadges = badges.filter((b) =>
    ["verified_email", "verified_phone", "verified_identity"].includes(b.code),
  );

  const full: TrustPassport = {
    subjectType: input.profile.subjectType,
    subjectId: input.profile.subjectId,
    profilePublicId: input.profile.publicId,
    displayName: input.displayName ?? null,
    visibility: "private",
    identity: {
      emailVerified: input.identity.emailVerified,
      phoneVerified: input.identity.phoneVerified,
      governmentIdVerified: input.identity.governmentIdVerified,
      organizationVerified: input.identity.organizationVerified,
      verificationLevel: verificationLevel(input),
      badges: identityBadges,
    },
    summary: {
      overallScore: input.profile.overallScore,
      band: bandForScore(input.profile.overallScore),
      trend: input.profile.trend,
      trendDelta: input.profile.trendDelta,
      lastUpdated: input.profile.calculatedAt,
    },
    dimensions: dimensionViews(input),
    achievements: buildPassportAchievements(input),
    badges,
    guidance: buildPassportGuidance(input),
    timeline: buildPassportTimeline(input),
    reasons: [...input.profile.reasons],
    warnings: [...input.profile.warnings],
    modelVersion: TRUST_PASSPORT_MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    sourceProfileVersion: input.profile.version,
    advisoryOnly: true,
  };

  return applyPassportVisibility(full, visibility);
}
