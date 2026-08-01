/**
 * Knowledge layer — read-only frozen snapshots for AI context.
 * Never mutates domain. Uses Prisma reads only (no domain writes).
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { KnowledgeSnapshot, KnowledgeSnapshotKind } from "@/lib/ai/types";

async function campaignSnapshot(id: string): Promise<KnowledgeSnapshot> {
  const campaign = await prisma.campaign.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      name: true,
      status: true,
      organizationId: true,
      targetQuantity: true,
      completedQuantity: true,
      approvedQuantity: true,
      rejectedQuantity: true,
      rewardPerUnitMinor: true,
      budgetMinor: true,
      currency: true,
      countryScope: true,
      languageScope: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return {
    kind: "campaign",
    subjectId: id,
    frozenAt: new Date().toISOString(),
    data: campaign
      ? {
          id: campaign.id,
          publicId: campaign.publicId,
          name: campaign.name,
          status: campaign.status,
          organizationId: campaign.organizationId,
          targetQuantity: campaign.targetQuantity,
          completedQuantity: campaign.completedQuantity,
          approvedQuantity: campaign.approvedQuantity,
          rejectedQuantity: campaign.rejectedQuantity,
          rewardPerUnitMinor: campaign.rewardPerUnitMinor,
          budgetMinor: campaign.budgetMinor,
          currency: campaign.currency,
          countryScope: campaign.countryScope,
          languageScope: campaign.languageScope,
          createdAt: campaign.createdAt.toISOString(),
          updatedAt: campaign.updatedAt.toISOString(),
        }
      : { missing: true },
  };
}

async function organizationSnapshot(id: string): Promise<KnowledgeSnapshot> {
  const org = await prisma.organization.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      name: true,
      kind: true,
      plan: true,
      createdAt: true,
    },
  });
  const campaignCount = org
    ? await prisma.campaign.count({ where: { organizationId: org.id } })
    : 0;
  return {
    kind: "organization",
    subjectId: id,
    frozenAt: new Date().toISOString(),
    data: org
      ? {
          id: org.id,
          publicId: org.publicId,
          name: org.name,
          kind: org.kind,
          plan: org.plan,
          campaignCount,
          createdAt: org.createdAt.toISOString(),
        }
      : { missing: true },
  };
}

async function workerSnapshot(id: string): Promise<KnowledgeSnapshot> {
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [{ id }, { userId: id }, { workerPublicId: id }],
    },
    select: {
      id: true,
      userId: true,
      displayName: true,
      handle: true,
      countryCode: true,
      workerPublicId: true,
      createdAt: true,
    },
  });

  if (!profile) {
    return {
      kind: "worker",
      subjectId: id,
      frozenAt: new Date().toISOString(),
      data: { missing: true },
    };
  }

  const [assignmentCount, submissionCount, approvedReviews] =
    await Promise.all([
      prisma.assignment.count({ where: { workerUserId: profile.userId } }),
      prisma.submission.count({ where: { workerUserId: profile.userId } }),
      prisma.reviewDecision.count({
        where: {
          submission: { workerUserId: profile.userId },
          outcome: "approved",
        },
      }),
    ]);

  return {
    kind: "worker",
    subjectId: id,
    frozenAt: new Date().toISOString(),
    data: {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      handle: profile.handle,
      countryCode: profile.countryCode,
      workerPublicId: profile.workerPublicId,
      assignmentCount,
      submissionCount,
      approvedReviewCount: approvedReviews,
      createdAt: profile.createdAt.toISOString(),
    },
  };
}

async function submissionSnapshot(id: string): Promise<KnowledgeSnapshot> {
  const submission = await prisma.submission.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      status: true,
      assignmentId: true,
      workerUserId: true,
      submittedAt: true,
      createdAt: true,
      gpsSnapshot: true,
      deviceSnapshot: true,
      assignment: {
        select: { campaignId: true },
      },
    },
  });
  return {
    kind: "submission",
    subjectId: id,
    frozenAt: new Date().toISOString(),
    data: submission
      ? {
          id: submission.id,
          publicId: submission.publicId,
          status: submission.status,
          assignmentId: submission.assignmentId,
          workerUserId: submission.workerUserId,
          campaignId: submission.assignment.campaignId,
          hasGps: Boolean(submission.gpsSnapshot),
          hasDevice: Boolean(submission.deviceSnapshot),
          submittedAt: submission.submittedAt?.toISOString() ?? null,
          createdAt: submission.createdAt.toISOString(),
        }
      : { missing: true },
  };
}

async function paymentSummarySnapshot(
  organizationId: string,
): Promise<KnowledgeSnapshot> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [total, thisMonth, completedMinor] = await Promise.all([
    prisma.paymentIntent.count({ where: { organizationId } }),
    prisma.paymentIntent.count({
      where: { organizationId, createdAt: { gte: startOfMonth } },
    }),
    prisma.paymentIntent.aggregate({
      where: { organizationId, status: "completed" },
      _sum: { amountMinor: true },
    }),
  ]);

  return {
    kind: "payment_summary",
    subjectId: organizationId,
    frozenAt: new Date().toISOString(),
    data: {
      organizationId,
      paymentIntentCount: total,
      paymentIntentsThisMonth: thisMonth,
      completedAmountMinor: completedMinor._sum.amountMinor ?? 0,
      note: "Advisory summary only — wallets remain ledger projections",
    },
  };
}

async function trustSummarySnapshot(
  subjectId: string,
): Promise<KnowledgeSnapshot> {
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [{ userId: subjectId }, { workerPublicId: subjectId }, { id: subjectId }],
    },
    select: { userId: true, workerPublicId: true },
  });
  const userId = profile?.userId ?? subjectId;

  const [trustedDevices, totalDevices, rejectedDecisions, approvedDecisions] =
    await Promise.all([
      prisma.device.count({
        where: { userId, trustedAt: { not: null }, revokedAt: null },
      }),
      prisma.device.count({ where: { userId, revokedAt: null } }),
      prisma.reviewDecision.count({
        where: {
          submission: { workerUserId: userId },
          outcome: "rejected",
        },
      }),
      prisma.reviewDecision.count({
        where: {
          submission: { workerUserId: userId },
          outcome: "approved",
        },
      }),
    ]);

  const decided = approvedDecisions + rejectedDecisions;
  const approvalRate = decided > 0 ? approvedDecisions / decided : null;

  return {
    kind: "trust_summary",
    subjectId,
    frozenAt: new Date().toISOString(),
    data: {
      userId,
      workerPublicId: profile?.workerPublicId ?? null,
      trustedDevices,
      totalDevices,
      approvedDecisions,
      rejectedDecisions,
      approvalRate,
      note: "Provisional trust signals — Phase 4.2 Trust Engine will own scores",
    },
  };
}

export async function loadKnowledgeSnapshot(params: {
  kind: KnowledgeSnapshotKind;
  subjectId: string;
}): Promise<KnowledgeSnapshot> {
  switch (params.kind) {
    case "campaign":
      return campaignSnapshot(params.subjectId);
    case "organization":
      return organizationSnapshot(params.subjectId);
    case "worker":
      return workerSnapshot(params.subjectId);
    case "submission":
      return submissionSnapshot(params.subjectId);
    case "payment_summary":
      return paymentSummarySnapshot(params.subjectId);
    case "trust_summary":
      return trustSummarySnapshot(params.subjectId);
    default: {
      const _exhaustive: never = params.kind;
      return _exhaustive;
    }
  }
}
