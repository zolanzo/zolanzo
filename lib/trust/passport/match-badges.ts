/**
 * Lightweight badge metadata for Match Engine — sync, no DB.
 * Uses Passport BadgeEngine over existing signals (never recalculates trust).
 */

import { earnedBadgeCodes } from "@/lib/trust/passport/badge-engine";
import { isTrustPassportEnabled, isTrustBadgesEnabled } from "@/lib/trust/passport/config";
import type { TrustProfile } from "@/lib/trust/types";

export function matchBadgeMetadataFromSignals(params: {
  userId: string;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  approvalRate: number;
  completedTasks: number;
  accountAgeDays: number;
  organizationCount: number;
}): string[] {
  if (!isTrustPassportEnabled() || !isTrustBadgesEnabled()) return [];

  const stubProfile = {
    userId: params.userId,
    publicId: "TRS-MATCH",
    subjectKind: "worker" as const,
    subjectType: "worker" as const,
    subjectId: params.userId,
    overallScore: params.trustScore,
    dimensions: {
      identity:
        (params.emailVerified ? 25 : 0) + (params.phoneVerified ? 25 : 0),
      reliability: Math.round(params.trustScore * 0.9),
      quality: Math.round(params.approvalRate * 100),
      behavior: 100,
      experience: Math.min(100, Math.round(params.accountAgeDays / 5)),
      reputation: Math.min(100, 45 + params.organizationCount * 5),
    },
    dimensionDetails: [],
    trend: "stable" as const,
    trendDelta: 0,
    reasons: [],
    warnings: [],
    lastInfluencingEvents: [],
    modelVersion: "stub",
    version: 1,
    calculatedAt: new Date().toISOString(),
    lastEventAt: null,
    advisoryOnly: true as const,
  } satisfies TrustProfile;

  return earnedBadgeCodes({
    profile: stubProfile,
    identity: {
      emailVerified: params.emailVerified,
      phoneVerified: params.phoneVerified,
      governmentIdVerified: false,
      organizationVerified: false,
    },
    stats: {
      assignmentsCompleted: params.completedTasks,
      accountAgeDays: params.accountAgeDays,
      approvalRate: params.approvalRate,
      organizationEndorsements: 0,
      revisionRequestCount: 0,
      fraudConfirmedCount: 0,
      distinctOrganizations: params.organizationCount,
    },
  });
}
