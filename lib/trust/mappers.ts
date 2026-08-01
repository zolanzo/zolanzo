/**
 * Map persisted rows ↔ TrustProfile domain objects.
 */

import type { TrustProfile as TrustProfileRow } from "@/lib/generated/prisma/client";
import type {
  TrustDimensionScore,
  TrustProfile,
  TrustSubjectType,
  TrustTrend,
} from "@/lib/trust/types";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asInfluencing(
  value: unknown,
): TrustProfile["lastInfluencingEvents"] {
  if (!Array.isArray(value)) return [];
  const out: TrustProfile["lastInfluencingEvents"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (
      typeof rec.eventType === "string" &&
      typeof rec.occurredAt === "string" &&
      typeof rec.decayedWeight === "number"
    ) {
      out.push({
        eventType: rec.eventType,
        occurredAt: rec.occurredAt,
        decayedWeight: rec.decayedWeight,
      });
    }
  }
  return out;
}

export function mapTrustProfileRow(
  row: TrustProfileRow,
): TrustProfile {
  const subjectType = row.subjectType as TrustSubjectType;
  return {
    userId: row.userId ?? row.subjectId,
    publicId: row.publicId,
    subjectKind:
      subjectType === "organization"
        ? "organization"
        : subjectType === "reviewer"
          ? "reviewer"
          : "worker",
    subjectType,
    subjectId: row.subjectId,
    overallScore: row.overallScore,
    dimensions: {
      identity: row.identityScore,
      reliability: row.reliabilityScore,
      quality: row.qualityScore,
      behavior: row.behaviorScore,
      experience: row.experienceScore,
      reputation: row.reputationScore,
    },
    dimensionDetails: Array.isArray(row.dimensionDetails)
      ? (row.dimensionDetails as TrustDimensionScore[])
      : [],
    trend: row.trend as TrustTrend,
    trendDelta: row.trendDelta,
    reasons: asStringArray(row.reasons),
    warnings: asStringArray(row.warnings),
    lastInfluencingEvents: asInfluencing(row.lastInfluencingEvents),
    modelVersion: row.modelVersion,
    version: row.version,
    calculatedAt: row.lastCalculatedAt.toISOString(),
    lastEventAt: row.lastEventAt?.toISOString() ?? null,
    advisoryOnly: true,
  };
}

export function profileToPersistData(profile: TrustProfile) {
  return {
    overallScore: profile.overallScore,
    identityScore: profile.dimensions.identity,
    reliabilityScore: profile.dimensions.reliability,
    qualityScore: profile.dimensions.quality,
    behaviorScore: profile.dimensions.behavior,
    experienceScore: profile.dimensions.experience,
    reputationScore: profile.dimensions.reputation,
    trend: profile.trend,
    trendDelta: profile.trendDelta,
    reasons: profile.reasons,
    warnings: profile.warnings,
    dimensionDetails: profile.dimensionDetails,
    lastInfluencingEvents: profile.lastInfluencingEvents,
    lastEventAt: profile.lastEventAt ? new Date(profile.lastEventAt) : null,
    lastCalculatedAt: new Date(profile.calculatedAt),
    modelVersion: profile.modelVersion,
  };
}
