/**
 * PassportService — load TrustProfile evidence and build a Trust Passport.
 * Never calculates trust; TrustProfileService owns scores.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  history,
  resolveProfile,
} from "@/lib/trust/trust-profile-service";
import { loadTrustSignalSnapshot } from "@/lib/trust/profile-loader";
import { buildTrustPassport } from "@/lib/trust/passport/passport-builder";
import { earnedBadgeCodes } from "@/lib/trust/passport/badge-engine";
import { recordPassportGeneration } from "@/lib/trust/passport/passport-telemetry";
import { isTrustPassportEnabled } from "@/lib/trust/passport/config";
import type {
  PassportBuildInput,
  PassportVisibility,
  TrustPassport,
} from "@/lib/trust/passport/types";
import type { TrustSubjectType } from "@/lib/trust/types";

export type GetPassportInput = {
  subjectType: TrustSubjectType;
  subjectId: string;
  visibility?: PassportVisibility;
  /** Ensure profile exists via TrustProfileService */
  ensureProfile?: boolean;
};

async function loadBuildInput(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
  ensureProfile: boolean;
}): Promise<PassportBuildInput | null> {
  const profile = await resolveProfile({
    subjectType: params.subjectType,
    subjectId: params.subjectId,
    ensure: params.ensureProfile,
  });
  if (!profile) return null;

  let displayName: string | null = null;
  if (params.subjectType !== "organization") {
    const user = await prisma.user.findUnique({
      where: { id: params.subjectId },
      select: {
        profile: { select: { displayName: true } },
      },
    });
    displayName = user?.profile?.displayName ?? null;
  }

  let identity = {
    emailVerified: false,
    phoneVerified: false,
    governmentIdVerified: false,
    organizationVerified: false,
  };
  let stats = {
    assignmentsCompleted: 0,
    accountAgeDays: 0,
    approvalRate: 0.7,
    organizationEndorsements: 0,
    revisionRequestCount: 0,
    fraudConfirmedCount: 0,
    distinctOrganizations: 0,
  };

  if (params.subjectType !== "organization") {
    try {
      const snap = await loadTrustSignalSnapshot(params.subjectId);
      identity = {
        emailVerified: snap.emailVerified,
        phoneVerified: snap.phoneVerified,
        governmentIdVerified: snap.governmentIdVerified,
        organizationVerified: snap.organizationVerified,
      };
      stats = {
        assignmentsCompleted: snap.assignmentsCompleted,
        accountAgeDays: snap.accountAgeDays,
        approvalRate:
          snap.reviewsDecided > 0
            ? snap.reviewsApproved / snap.reviewsDecided
            : 0.7,
        organizationEndorsements: snap.organizationEndorsements,
        revisionRequestCount: snap.revisionRequestCount,
        fraudConfirmedCount: snap.fraudConfirmedCount,
        distinctOrganizations: snap.distinctOrganizations,
      };
    } catch {
      // Profile still usable with defaults
    }
  }

  const hist = await history({
    subjectType: params.subjectType,
    subjectId: params.subjectId,
    limit: 20,
  });

  const eventRows = await prisma.trustEvent.findMany({
    where: {
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      status: "processed",
    },
    orderBy: { occurredAt: "desc" },
    take: 30,
    select: {
      eventType: true,
      occurredAt: true,
      decayedWeight: true,
    },
  });

  return {
    profile,
    displayName,
    identity,
    stats,
    history: hist.map((h) => ({
      overallScore: h.overallScore,
      calculatedAt: h.calculatedAt,
      trend: h.trend,
    })),
    events: [
      ...eventRows.map((e) => ({
        eventType: e.eventType,
        occurredAt: e.occurredAt.toISOString(),
        decayedWeight: e.decayedWeight ?? undefined,
      })),
      ...profile.lastInfluencingEvents.map((e) => ({
        eventType: e.eventType,
        occurredAt: e.occurredAt,
        decayedWeight: e.decayedWeight,
      })),
    ],
  };
}

export async function getTrustPassport(
  input: GetPassportInput,
): Promise<TrustPassport | null> {
  const started = Date.now();
  const visibility = input.visibility ?? "private";

  if (!isTrustPassportEnabled()) {
    recordPassportGeneration({
      success: true,
      latencyMs: Date.now() - started,
      visibility,
    });
    return null;
  }

  try {
    const buildInput = await loadBuildInput({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ensureProfile: input.ensureProfile ?? true,
    });
    if (!buildInput) {
      recordPassportGeneration({
        success: false,
        latencyMs: Date.now() - started,
        visibility,
      });
      return null;
    }

    const passport = buildTrustPassport(buildInput, visibility);
    recordPassportGeneration({
      success: true,
      latencyMs: Date.now() - started,
      visibility,
      badgesEarned: passport.badges.filter((b) => b.earned).map((b) => b.code),
      timelineCount: passport.timeline.length,
    });
    return passport;
  } catch (error) {
    recordPassportGeneration({
      success: false,
      latencyMs: Date.now() - started,
      visibility,
    });
    throw error;
  }
}

/** Match Engine helper — badge codes only, no full passport. */
export async function getPassportBadgeMetadata(params: {
  subjectType: TrustSubjectType;
  subjectId: string;
}): Promise<string[]> {
  if (!isTrustPassportEnabled()) return [];
  const buildInput = await loadBuildInput({
    ...params,
    ensureProfile: false,
  });
  if (!buildInput) return [];
  return earnedBadgeCodes(buildInput);
}

export const PassportService = {
  getTrustPassport,
  getPassportBadgeMetadata,
  buildTrustPassport,
};
