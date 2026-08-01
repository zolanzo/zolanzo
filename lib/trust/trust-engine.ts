/**
 * TrustEngine — assemble profile from signal snapshot.
 */

import { calculateTrustScores } from "@/lib/trust/calculator";
import {
  isTrustEngineEnabled,
  TRUST_ENGINE_MODEL_VERSION,
} from "@/lib/trust/config";
import { buildTrustExplanation } from "@/lib/trust/explanation-builder";
import { analyzeTrustTrend } from "@/lib/trust/trend-analyzer";
import { recordTrustRecalculation } from "@/lib/trust/telemetry";
import type {
  TrustProfile,
  TrustSignalSnapshot,
  TrustSubjectType,
} from "@/lib/trust/types";
import { randomPublicSegment } from "@/lib/public-id/format";

function allocateTrustPublicId(): string {
  return `TRS-${randomPublicSegment(6)}`;
}

const profilePublicIds = new Map<string, string>();

export function getOrCreateTrustPublicId(userId: string): string {
  const existing = profilePublicIds.get(userId);
  if (existing) return existing;
  const id = allocateTrustPublicId();
  profilePublicIds.set(userId, id);
  return id;
}

function subjectTypeFromKind(
  kind: TrustSignalSnapshot["subjectKind"],
): TrustSubjectType {
  if (kind === "organization") return "organization";
  if (kind === "reviewer") return "reviewer";
  return "worker";
}

export function buildTrustProfileFromSnapshot(
  snap: TrustSignalSnapshot,
  options?: {
    forceDisabled?: boolean;
    publicId?: string;
    version?: number;
  },
): TrustProfile {
  const started = Date.now();
  const subjectType = subjectTypeFromKind(snap.subjectKind);
  const publicId =
    options?.publicId ?? getOrCreateTrustPublicId(snap.userId);

  if (options?.forceDisabled || !isTrustEngineEnabled()) {
    const latencyMs = Date.now() - started;
    recordTrustRecalculation({
      success: true,
      latencyMs,
      overallScore: 0,
      trend: "unknown",
    });
    return {
      userId: snap.userId,
      publicId,
      subjectKind: snap.subjectKind,
      subjectType,
      subjectId: snap.userId,
      overallScore: 0,
      dimensions: {
        identity: 0,
        reliability: 0,
        quality: 0,
        behavior: 0,
        experience: 0,
        reputation: 0,
      },
      dimensionDetails: [],
      trend: "unknown",
      trendDelta: 0,
      reasons: ["Trust Engine is disabled."],
      warnings: [],
      lastInfluencingEvents: [],
      modelVersion: TRUST_ENGINE_MODEL_VERSION,
      version: options?.version ?? 1,
      calculatedAt: new Date().toISOString(),
      lastEventAt: null,
      advisoryOnly: true,
    };
  }

  try {
    const scores = calculateTrustScores(snap);
    const recentPositive = snap.weightedEvents
      .filter((e) => e.decayedWeight > 0)
      .reduce((s, e) => s + e.decayedWeight, 0);
    const recentNegative = snap.weightedEvents
      .filter((e) => e.decayedWeight < 0)
      .reduce((s, e) => s + Math.abs(e.decayedWeight), 0);

    const { trend, trendDelta } = analyzeTrustTrend({
      currentOverall: scores.overallScore,
      previousOverall: snap.previousOverallScore,
      recentPositiveWeight: recentPositive,
      recentNegativeWeight: recentNegative,
    });

    const { reasons, warnings } = buildTrustExplanation({
      overallScore: scores.overallScore,
      dimensionDetails: scores.dimensionDetails,
      trend,
    });

    const sortedEvents = [...snap.weightedEvents].sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
    );
    const lastEventAt = sortedEvents[0]?.occurredAt ?? null;
    const lastInfluencingEvents = sortedEvents.slice(0, 8).map((e) => ({
      eventType: e.type,
      occurredAt: e.occurredAt,
      decayedWeight: Math.round(e.decayedWeight * 100) / 100,
    }));

    const profile: TrustProfile = {
      userId: snap.userId,
      publicId,
      subjectKind: snap.subjectKind,
      subjectType,
      subjectId: snap.userId,
      overallScore: scores.overallScore,
      dimensions: scores.dimensions,
      dimensionDetails: scores.dimensionDetails,
      trend,
      trendDelta,
      reasons,
      warnings,
      lastInfluencingEvents,
      modelVersion: TRUST_ENGINE_MODEL_VERSION,
      version: options?.version ?? 1,
      calculatedAt: new Date().toISOString(),
      lastEventAt,
      advisoryOnly: true,
    };

    const latencyMs = Date.now() - started;
    recordTrustRecalculation({
      success: true,
      latencyMs,
      overallScore: profile.overallScore,
      trend: profile.trend,
      identityNewlyVerified:
        snap.emailVerified &&
        snap.phoneVerified &&
        (snap.governmentIdVerified || snap.organizationVerified),
    });

    return profile;
  } catch (error) {
    recordTrustRecalculation({
      success: false,
      latencyMs: Date.now() - started,
    });
    throw error;
  }
}

export type TrustEngine = {
  calculate(snap: TrustSignalSnapshot): TrustProfile;
};

export const trustEngine: TrustEngine = {
  calculate(snap) {
    return buildTrustProfileFromSnapshot(snap);
  },
};

export function resetTrustPublicIdsForTests(): void {
  profilePublicIds.clear();
}
