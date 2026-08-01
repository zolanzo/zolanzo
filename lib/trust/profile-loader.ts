/**
 * TrustProfileLoader — read-only Prisma → TrustSignalSnapshot.
 * Never writes domain tables.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { emptyTrustSignalSnapshot } from "@/lib/trust/signal-snapshot";
import { listTrustEvents, refreshDecayedEvents } from "@/lib/trust/event-processor";
import { getCachedTrustProfile } from "@/lib/trust/profile-service";
import type { TrustSignalSnapshot } from "@/lib/trust/types";

export async function loadTrustSignalSnapshot(
  userId: string,
): Promise<TrustSignalSnapshot> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
      suspendedAt: true,
      status: true,
      profile: { select: { countryCode: true } },
    },
  });
  if (!user) {
    throw new Error(`User not found for trust load: ${userId}`);
  }

  const [assignments, reviewDecisions, settlementCount] = await Promise.all([
    prisma.assignment.findMany({
      where: { workerUserId: userId },
      take: 500,
      select: {
        status: true,
        completedAt: true,
        expiresAt: true,
        createdAt: true,
        startedAt: true,
        campaignId: true,
        campaign: { select: { organizationId: true } },
      },
    }),
    prisma.reviewDecision.findMany({
      where: { submission: { workerUserId: userId } },
      take: 500,
      orderBy: { decidedAt: "desc" },
      select: {
        outcome: true,
        confidence: true,
        decidedAt: true,
      },
    }),
    prisma.settlement.count({
      where: { workerUserId: userId, status: "completed" },
    }),
  ]);

  const completed = assignments.filter((a) => a.status === "completed").length;
  const accepted = assignments.length;
  const deadlineMet = assignments.filter((a) => {
    if (!a.expiresAt || !a.completedAt) return a.status === "completed";
    return a.completedAt <= a.expiresAt;
  }).length;
  const deadlineDen = assignments.filter(
    (a) => a.status === "completed" || a.status === "expired",
  ).length;

  let responseSum = 0;
  let responseCount = 0;
  for (const a of assignments) {
    if (a.startedAt) {
      const hrs =
        (a.startedAt.getTime() - a.createdAt.getTime()) / 3_600_000;
      if (hrs >= 0 && hrs < 168) {
        responseSum += hrs;
        responseCount += 1;
      }
    }
  }

  const approved = reviewDecisions.filter(
    (d) =>
      d.outcome === "approved" || d.outcome === "approved_with_warning",
  ).length;
  const revisions = reviewDecisions.filter(
    (d) => d.outcome === "revision_requested",
  ).length;
  const confidences = reviewDecisions
    .map((d) => d.confidence)
    .filter((c): c is number => typeof c === "number");

  const campaignIds = new Set(assignments.map((a) => a.campaignId));
  const orgIds = new Set(
    assignments.map((a) => a.campaign.organizationId).filter(Boolean),
  );

  const now = Date.now();
  const accountAgeDays = Math.max(
    0,
    Math.floor((now - user.createdAt.getTime()) / 86_400_000),
  );

  const previous = getCachedTrustProfile(userId);
  refreshDecayedEvents(userId);

  return emptyTrustSignalSnapshot({
    userId,
    subjectKind: "worker",
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    governmentIdVerified: false, // Passport adapter later
    organizationVerified: false,
    addressVerified: false,
    assignmentsTotal: assignments.length,
    assignmentsCompleted: completed,
    assignmentsAccepted: accepted,
    assignmentsOffered: Math.max(accepted, assignments.length),
    avgResponseHours:
      responseCount > 0 ? responseSum / responseCount : null,
    deadlineMetRate:
      deadlineDen > 0 ? deadlineMet / deadlineDen : 0.7,
    attendanceRate: assignments.length > 0 ? completed / assignments.length : 0.85,
    reviewsDecided: reviewDecisions.length,
    reviewsApproved: approved,
    revisionRequestCount: revisions,
    avgReviewConfidence:
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : null,
    positiveFeedbackCount: Math.min(5, Math.floor(settlementCount / 2)),
    fraudConfirmedCount: 0,
    policyViolationCount: 0,
    appealUpheldCount: 0,
    appealDeniedCount: 0,
    warningCount: 0,
    suspensionCount: user.suspendedAt || user.status === "suspended" ? 1 : 0,
    accountAgeDays,
    distinctCampaigns: campaignIds.size,
    distinctOrganizations: orgIds.size,
    organizationEndorsements: 0,
    verifiedRecommendations: 0,
    previousOverallScore: previous?.overallScore ?? null,
    previousCalculatedAt: previous?.calculatedAt ?? null,
    weightedEvents: listTrustEvents(userId),
    frozenAt: new Date().toISOString(),
  });
}
