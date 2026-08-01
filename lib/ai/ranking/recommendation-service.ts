/**
 * RecommendationService — end-to-end match pipeline for a campaign.
 * Advisory only: never creates assignments or reservations.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { mergeEligibilityRules } from "@/features/campaigns/services/eligibility";
import type { TemplateConstraint } from "@/constants/constraints";
import { rankWorkersDetailed } from "@/lib/ai/ranking/ranking-engine";
import type {
  FairnessPolicy,
  MatchCampaignContext,
  WorkerMatchRecommendation,
  WorkerMatchSignals,
} from "@/lib/ai/ranking/match-types";
import { isMatchEngineEnabled } from "@/lib/ai/ranking/match-config";
import { resolveOverallTrustScore } from "@/lib/trust";
import { resolveScoresBatch } from "@/lib/trust/trust-profile-service";
import { matchBadgeMetadataFromSignals } from "@/lib/trust/passport/match-badges";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asConstraints(value: unknown): TemplateConstraint[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (c): c is TemplateConstraint =>
      Boolean(c) &&
      typeof c === "object" &&
      typeof (c as TemplateConstraint).id === "string" &&
      typeof (c as TemplateConstraint).kind === "string",
  );
}

async function loadCampaignContext(
  campaignId: string,
): Promise<MatchCampaignContext | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { OR: [{ id: campaignId }, { publicId: campaignId }] },
    select: {
      id: true,
      publicId: true,
      organizationId: true,
      name: true,
      category: true,
      status: true,
      countryScope: true,
      languageScope: true,
      deviceScope: true,
      audienceConstraints: true,
      rewardPerUnitMinor: true,
      budgetMinor: true,
      currency: true,
      targetQuantity: true,
      taskTemplate: {
        select: {
          requiredSkills: true,
          constraints: true,
        },
      },
    },
  });

  if (!campaign) return null;

  const merged = mergeEligibilityRules({
    templateConstraints: asConstraints(campaign.taskTemplate.constraints),
    campaignConstraints: asConstraints(campaign.audienceConstraints),
  });

  return {
    campaignId: campaign.id,
    publicId: campaign.publicId,
    organizationId: campaign.organizationId,
    name: campaign.name,
    category: campaign.category,
    status: campaign.status,
    countryScope: asStringArray(campaign.countryScope),
    languageScope: asStringArray(campaign.languageScope),
    deviceScope: asStringArray(campaign.deviceScope),
    requiredSkills: asStringArray(campaign.taskTemplate.requiredSkills),
    rewardPerUnitMinor: campaign.rewardPerUnitMinor,
    budgetMinor: campaign.budgetMinor,
    currency: campaign.currency,
    targetQuantity: campaign.targetQuantity,
    constraints: merged.constraints.map((c) => ({
      id: c.id,
      kind: c.kind,
      op: c.op,
      params: c.params,
      enforcement: c.enforcement,
      label: c.label,
    })),
  };
}

async function buildWorkerSignals(params: {
  organizationId: string;
  campaignCategory: string;
  rewardPerUnitMinor: number;
  limit?: number;
}): Promise<WorkerMatchSignals[]> {
  const profiles = await prisma.profile.findMany({
    where: { workerPublicId: { not: null } },
    take: params.limit ?? 200,
    orderBy: { createdAt: "desc" },
    select: {
      userId: true,
      workerPublicId: true,
      displayName: true,
      countryCode: true,
      createdAt: true,
      user: {
        select: {
          locale: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          memberships: {
            where: { status: "active" },
            select: { organizationId: true },
          },
        },
      },
    },
  });

  if (profiles.length === 0) return [];

  const userIds = profiles.map((p) => p.userId);

  const [
    assignments,
    reviews,
    activeByWorker,
    orgHistory,
    similarCompletions,
  ] = await Promise.all([
    prisma.assignment.groupBy({
      by: ["workerUserId", "status"],
      where: { workerUserId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.reviewDecision.groupBy({
      by: ["outcome"],
      where: { submission: { workerUserId: { in: userIds } } },
      _count: { _all: true },
    }),
    prisma.assignment.groupBy({
      by: ["workerUserId"],
      where: {
        workerUserId: { in: userIds },
        status: {
          in: [
            "assigned",
            "claimed",
            "started",
            "paused",
            "in_progress",
            "ready_for_submission",
            "submitted",
            "under_validation",
            "under_review",
            "revision_requested",
          ],
        },
      },
      _count: { _all: true },
    }),
    prisma.assignment.groupBy({
      by: ["workerUserId"],
      where: {
        workerUserId: { in: userIds },
        campaign: { organizationId: params.organizationId },
        status: "completed",
      },
      _count: { _all: true },
    }),
    prisma.assignment.groupBy({
      by: ["workerUserId"],
      where: {
        workerUserId: { in: userIds },
        status: "completed",
        campaign: { category: params.campaignCategory },
      },
      _count: { _all: true },
    }),
  ]);

  // Per-worker assignment totals
  const completedMap = new Map<string, number>();
  const totalMap = new Map<string, number>();
  for (const row of assignments) {
    const prev = totalMap.get(row.workerUserId) ?? 0;
    totalMap.set(row.workerUserId, prev + row._count._all);
    if (row.status === "completed") {
      completedMap.set(
        row.workerUserId,
        (completedMap.get(row.workerUserId) ?? 0) + row._count._all,
      );
    }
  }

  const activeMap = new Map(
    activeByWorker.map((r) => [r.workerUserId, r._count._all]),
  );
  const orgMap = new Map(
    orgHistory.map((r) => [r.workerUserId, r._count._all]),
  );
  const similarMap = new Map(
    similarCompletions.map((r) => [r.workerUserId, r._count._all]),
  );

  // Global approval rates are coarse; refine per worker with a second query
  const perWorkerReviews = await prisma.reviewDecision.findMany({
    where: { submission: { workerUserId: { in: userIds } } },
    select: {
      outcome: true,
      submission: { select: { workerUserId: true } },
    },
    take: 5000,
  });
  void reviews;

  const approvedMap = new Map<string, number>();
  const decidedMap = new Map<string, number>();
  for (const row of perWorkerReviews) {
    const uid = row.submission.workerUserId;
    decidedMap.set(uid, (decidedMap.get(uid) ?? 0) + 1);
    if (row.outcome === "approved" || row.outcome === "approved_with_warning") {
      approvedMap.set(uid, (approvedMap.get(uid) ?? 0) + 1);
    }
  }

  const now = Date.now();

  const persistedScores = await resolveScoresBatch({
    subjectType: "worker",
    subjectIds: profiles.map((p) => p.userId),
  });

  return profiles.map((profile) => {
    const completed = completedMap.get(profile.userId) ?? 0;
    const total = totalMap.get(profile.userId) ?? 0;
    const decided = decidedMap.get(profile.userId) ?? 0;
    const approved = approvedMap.get(profile.userId) ?? 0;
    const approvalRate = decided > 0 ? approved / decided : 0.7;
    const completionRate = total > 0 ? completed / total : 0.6;
    const emailVerified = Boolean(profile.user.emailVerifiedAt);
    const phoneVerified = Boolean(profile.user.phoneVerifiedAt);
    const accountAgeDays = Math.max(
      0,
      Math.floor((now - profile.createdAt.getTime()) / 86_400_000),
    );
    const trustScore =
      persistedScores.get(profile.userId) ??
      resolveOverallTrustScore({
        userId: profile.userId,
        emailVerified,
        phoneVerified,
        approvalRate,
        completionRate,
        completedAssignments: completed,
        totalAssignments: total,
        reviewsDecided: decided,
        reviewsApproved: approved,
        accountAgeDays,
        distinctOrganizations: orgMap.get(profile.userId) ?? 0,
      });
    const languages = profile.user.locale
      ? [profile.user.locale.split("-")[0] ?? profile.user.locale]
      : ["en"];
    const activeAssignments = activeMap.get(profile.userId) ?? 0;

    return {
      workerId: profile.userId,
      workerPublicId: profile.workerPublicId,
      displayName: profile.displayName,
      countryCode: profile.countryCode,
      region: profile.countryCode,
      languages,
      skills: [],
      platforms: [],
      organizationIds: profile.user.memberships.map((m) => m.organizationId),
      trustScore,
      trustBadges: matchBadgeMetadataFromSignals({
        userId: profile.userId,
        trustScore,
        emailVerified,
        phoneVerified,
        approvalRate,
        completedTasks: completed,
        accountAgeDays,
        organizationCount: orgMap.get(profile.userId) ?? 0,
      }),
      identityVerified: emailVerified && phoneVerified,
      emailVerified,
      phoneVerified,
      completionRate,
      approvalRate,
      completedTasks: completed,
      similarCampaignCompletions: similarMap.get(profile.userId) ?? 0,
      activeAssignments,
      capacityRemaining: Math.max(0, 4 - activeAssignments),
      hoursSinceLastActivity: null,
      responseSpeedScore: Math.min(100, 50 + Math.min(40, completed * 2)),
      organizationHistoryCount: orgMap.get(profile.userId) ?? 0,
      expectedPayoutMinor: params.rewardPerUnitMinor,
      accountAgeDays,
      distanceScore: 0.2,
    } satisfies WorkerMatchSignals;
  });
}

export type RecommendWorkersInput = {
  campaignId: string;
  organizationId?: string;
  topN?: number;
  candidateWorkerIds?: string[];
  fairness?: Partial<FairnessPolicy> | null;
  forceRuleOnly?: boolean;
  /** Inject pool for tests / offline */
  poolOverride?: WorkerMatchSignals[];
};

export type RecommendWorkersResult = {
  campaignId: string;
  organizationId: string;
  recommendations: WorkerMatchRecommendation[];
  candidateCount: number;
  eligibleCount: number;
  modelVersion: string;
  advisoryOnly: true;
  fairnessApplied: boolean;
  aiAugmented: boolean;
  fallbackUsed: boolean;
  latencyMs: number;
  disabled: boolean;
};

/**
 * Recommend top workers for a campaign. Does not assign.
 */
export async function recommendWorkersForCampaign(
  input: RecommendWorkersInput,
): Promise<RecommendWorkersResult> {
  if (!isMatchEngineEnabled()) {
    return {
      campaignId: input.campaignId,
      organizationId: input.organizationId ?? "",
      recommendations: [],
      candidateCount: 0,
      eligibleCount: 0,
      modelVersion: "match-engine/disabled",
      advisoryOnly: true,
      fairnessApplied: false,
      aiAugmented: false,
      fallbackUsed: true,
      latencyMs: 0,
      disabled: true,
    };
  }

  const campaign = await loadCampaignContext(input.campaignId);
  if (!campaign) {
    throw new Error(`Campaign not found: ${input.campaignId}`);
  }

  if (
    input.organizationId &&
    input.organizationId !== campaign.organizationId
  ) {
    throw new Error("Campaign does not belong to organization");
  }

  const pool =
    input.poolOverride ??
    (await buildWorkerSignals({
      organizationId: campaign.organizationId,
      campaignCategory: campaign.category,
      rewardPerUnitMinor: campaign.rewardPerUnitMinor,
    }));

  const ranked = await rankWorkersDetailed({
    campaign,
    pool,
    candidateWorkerIds: input.candidateWorkerIds,
    topN: input.topN ?? 10,
    fairness: input.fairness,
    forceRuleOnly: input.forceRuleOnly,
  });

  return {
    campaignId: campaign.campaignId,
    organizationId: campaign.organizationId,
    recommendations: ranked.recommendations,
    candidateCount: ranked.candidateCount,
    eligibleCount: ranked.eligibleCount,
    modelVersion: ranked.modelVersion,
    advisoryOnly: true,
    fairnessApplied: ranked.fairnessApplied,
    aiAugmented: ranked.aiAugmented,
    fallbackUsed: ranked.fallbackUsed,
    latencyMs: ranked.latencyMs,
    disabled: false,
  };
}
