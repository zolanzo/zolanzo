/**
 * OrganizationCopilotService — load org facts + ask copilot.
 * Read-only Prisma access; never mutates domain.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Permission } from "@/constants/permissions";
import { askOrganizationCopilot } from "@/lib/ai/copilot/organization-copilot";
import type {
  OrgCopilotResponse,
  OrgKnowledgeFacts,
} from "@/lib/ai/copilot/org-types";
import type { OrgCopilotAuthContext } from "@/lib/ai/copilot/permission-filter";

export type AskOrgCopilotServiceInput = {
  organizationId: string;
  actorUserId: string;
  question: string;
  /** Permissions already resolved by caller (RBAC) */
  permissions: readonly Permission[];
  /** Pre-checked membership */
  isOrgMember: boolean;
  threadKey?: string;
  forceRuleOnly?: boolean;
  /** Inject facts for tests / offline */
  factsOverride?: OrgKnowledgeFacts;
};

async function loadOrgKnowledgeFacts(
  organizationId: string,
): Promise<OrgKnowledgeFacts> {
  const org = await prisma.organization.findFirst({
    where: { OR: [{ id: organizationId }, { publicId: organizationId }] },
    select: { id: true, name: true },
  });
  if (!org) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  const quarterStart = new Date();
  const month = quarterStart.getUTCMonth();
  quarterStart.setUTCMonth(month - (month % 3), 1);
  quarterStart.setUTCHours(0, 0, 0, 0);

  const [campaigns, payments, queueItems] = await Promise.all([
    prisma.campaign.findMany({
      where: { organizationId: org.id },
      take: 100,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        publicId: true,
        name: true,
        status: true,
        targetQuantity: true,
        completedQuantity: true,
        approvedQuantity: true,
        rejectedQuantity: true,
        budgetMinor: true,
        spentBudgetMinor: true,
        countryScope: true,
        endAt: true,
        currency: true,
      },
    }),
    prisma.paymentIntent.findMany({
      where: { organizationId: org.id },
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        publicId: true,
        status: true,
        amountMinor: true,
        createdAt: true,
      },
    }),
    prisma.reviewQueueItem.findMany({
      where: {
        submission: {
          assignment: { campaign: { organizationId: org.id } },
        },
        status: { in: ["pending", "assigned", "in_progress"] },
      },
      take: 200,
      select: {
        assignedReviewerId: true,
        status: true,
      },
    }),
  ]);

  // Workers via assignments for this org
  const assignmentGroups = await prisma.assignment.groupBy({
    by: ["workerUserId", "status"],
    where: { campaign: { organizationId: org.id } },
    _count: { _all: true },
  });

  const workerIds = [...new Set(assignmentGroups.map((g) => g.workerUserId))];
  const profiles =
    workerIds.length > 0
      ? await prisma.profile.findMany({
          where: { userId: { in: workerIds } },
          select: { userId: true, displayName: true },
        })
      : [];
  const nameByUser = new Map(profiles.map((p) => [p.userId, p.displayName]));

  const completedMap = new Map<string, number>();
  const activeMap = new Map<string, number>();
  const totalMap = new Map<string, number>();
  for (const row of assignmentGroups) {
    totalMap.set(
      row.workerUserId,
      (totalMap.get(row.workerUserId) ?? 0) + row._count._all,
    );
    if (row.status === "completed") {
      completedMap.set(
        row.workerUserId,
        (completedMap.get(row.workerUserId) ?? 0) + row._count._all,
      );
    }
    if (
      [
        "assigned",
        "claimed",
        "started",
        "paused",
        "in_progress",
        "submitted",
        "under_validation",
        "under_review",
      ].includes(row.status)
    ) {
      activeMap.set(
        row.workerUserId,
        (activeMap.get(row.workerUserId) ?? 0) + row._count._all,
      );
    }
  }

  const reviews =
    workerIds.length > 0
      ? await prisma.reviewDecision.findMany({
          where: { submission: { workerUserId: { in: workerIds } } },
          select: {
            outcome: true,
            submission: { select: { workerUserId: true } },
          },
          take: 3000,
        })
      : [];
  const approvedMap = new Map<string, number>();
  const decidedMap = new Map<string, number>();
  for (const r of reviews) {
    const uid = r.submission.workerUserId;
    decidedMap.set(uid, (decidedMap.get(uid) ?? 0) + 1);
    if (r.outcome === "approved" || r.outcome === "approved_with_warning") {
      approvedMap.set(uid, (approvedMap.get(uid) ?? 0) + 1);
    }
  }

  const lastActivities =
    workerIds.length > 0
      ? await prisma.assignment.findMany({
          where: { workerUserId: { in: workerIds } },
          orderBy: { updatedAt: "desc" },
          distinct: ["workerUserId"],
          select: { workerUserId: true, updatedAt: true },
        })
      : [];
  const lastByUser = new Map(
    lastActivities.map((a) => [a.workerUserId, a.updatedAt.toISOString()]),
  );

  const trustRows =
    workerIds.length > 0
      ? await prisma.trustProfile.findMany({
          where: {
            subjectType: "worker",
            subjectId: { in: workerIds },
          },
          select: {
            subjectId: true,
            overallScore: true,
            trend: true,
            reliabilityScore: true,
          },
        })
      : [];
  const trustByUser = new Map(
    trustRows.map((t) => [
      t.subjectId,
      {
        trustScore: t.overallScore,
        trustTrend: t.trend,
        reliabilityScore: t.reliabilityScore,
      },
    ]),
  );

  const workers = workerIds.map((userId) => {
    const decided = decidedMap.get(userId) ?? 0;
    const approved = approvedMap.get(userId) ?? 0;
    const trust = trustByUser.get(userId);
    return {
      userId,
      displayName: nameByUser.get(userId) ?? userId.slice(0, 8),
      completedTasks: completedMap.get(userId) ?? 0,
      approvalRate: decided > 0 ? approved / decided : 0.7,
      activeAssignments: activeMap.get(userId) ?? 0,
      lastActivityAt: lastByUser.get(userId) ?? null,
      trustScore: trust?.trustScore ?? null,
      trustTrend: trust?.trustTrend ?? null,
      reliabilityScore: trust?.reliabilityScore ?? null,
    };
  });

  const reviewerMap = new Map<
    string,
    { pending: number; assigned: number }
  >();
  for (const item of queueItems) {
    const uid = item.assignedReviewerId ?? "unassigned";
    const cur = reviewerMap.get(uid) ?? { pending: 0, assigned: 0 };
    if (item.status === "pending") cur.pending += 1;
    else cur.assigned += 1;
    reviewerMap.set(uid, cur);
  }
  const reviewerIds = [...reviewerMap.keys()].filter((id) => id !== "unassigned");
  const reviewerProfiles =
    reviewerIds.length > 0
      ? await prisma.profile.findMany({
          where: { userId: { in: reviewerIds } },
          select: { userId: true, displayName: true },
        })
      : [];
  const reviewerNames = new Map(
    reviewerProfiles.map((p) => [p.userId, p.displayName]),
  );

  const spendingAgg = await prisma.paymentIntent.aggregate({
    where: {
      organizationId: org.id,
      status: "completed",
      createdAt: { gte: quarterStart },
    },
    _sum: { amountMinor: true },
  });

  // Lightweight fraud proxy from rejection ratios per campaign
  const fraudTrends = campaigns.map((c) => {
    const decided = c.approvedQuantity + c.rejectedQuantity;
    const rejectRate = decided > 0 ? c.rejectedQuantity / decided : 0;
    return {
      campaignId: c.id,
      campaignName: c.name,
      highRiskCount: rejectRate >= 0.25 ? Math.round(rejectRate * 10) : 0,
      avgRiskScore: Math.round(rejectRate * 100),
    };
  });

  return {
    organizationId: org.id,
    organizationName: org.name,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      publicId: c.publicId,
      name: c.name,
      status: c.status,
      targetQuantity: c.targetQuantity,
      completedQuantity: c.completedQuantity,
      approvedQuantity: c.approvedQuantity,
      rejectedQuantity: c.rejectedQuantity,
      budgetMinor: c.budgetMinor,
      spentBudgetMinor: c.spentBudgetMinor,
      countryScope: Array.isArray(c.countryScope)
        ? (c.countryScope as string[]).filter((x) => typeof x === "string")
        : [],
      endAt: c.endAt?.toISOString() ?? null,
    })),
    workers,
    reviewers: [...reviewerMap.entries()].map(([userId, counts]) => ({
      userId,
      displayName:
        userId === "unassigned"
          ? "Unassigned"
          : (reviewerNames.get(userId) ?? userId.slice(0, 8)),
      pendingQueue: counts.pending,
      assignedCount: counts.assigned,
    })),
    payments: payments.map((p) => ({
      publicId: p.publicId,
      status: p.status,
      amountMinor: p.amountMinor,
      createdAt: p.createdAt.toISOString(),
    })),
    fraudTrends,
    spendingThisQuarterMinor: spendingAgg._sum.amountMinor ?? 0,
    currency: campaigns[0]?.currency ?? "NGN",
    frozenAt: new Date().toISOString(),
  };
}

export async function askOrgCopilot(
  input: AskOrgCopilotServiceInput,
): Promise<OrgCopilotResponse> {
  const facts =
    input.factsOverride ?? (await loadOrgKnowledgeFacts(input.organizationId));

  const auth: OrgCopilotAuthContext = {
    organizationId: facts.organizationId,
    actorUserId: input.actorUserId,
    isOrgMember: input.isOrgMember,
    permissions: input.permissions,
  };

  return askOrganizationCopilot({
    organizationId: facts.organizationId,
    actorUserId: input.actorUserId,
    question: input.question,
    auth,
    facts,
    threadKey: input.threadKey,
    forceRuleOnly: input.forceRuleOnly,
  });
}
