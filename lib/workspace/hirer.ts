import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getAuthContext, resolveAuthContext } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/validation/env";
import { walletRepository } from "@/features/wallet/services/projection";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { isLocalUiPreview } from "@/lib/dev/local-ui";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";
import { createPreviewHirerWorkspace } from "@/lib/workspace/preview-workspace";
import type {
  HirerCampaignRow,
  HirerInvitationRow,
  HirerLedgerRow,
  HirerMemberRow,
  HirerOrganization,
  HirerReviewRow,
  HirerTemplateOption,
  HirerWalletSnapshot,
  HirerWorkerRow,
  HirerWorkspace,
} from "@/lib/workspace/hirer-types";

export type { HirerWorkspace } from "@/lib/workspace/hirer-types";

function emptyWallet(): HirerWalletSnapshot {
  return {
    walletId: null,
    availableMinor: 0,
    pendingMinor: 0,
    heldMinor: 0,
    lifetimePaidMinor: 0,
    availableLabel: formatNgnFromMinor(0),
    pendingLabel: formatNgnFromMinor(0),
    heldLabel: formatNgnFromMinor(0),
  };
}

export async function requireHirerWorkspace(
  loginNext = "/hirer/dashboard",
): Promise<HirerWorkspace> {
  const resolved = await resolveAuthContext();

  if (resolved.status === "unavailable") {
    return createPreviewHirerWorkspace({
      kind: "unavailable",
      service: resolved.service,
    });
  }

  if (resolved.status === "unauthenticated") {
    if (isLocalUiPreview()) {
      return createPreviewHirerWorkspace({ kind: "unauthenticated" });
    }
    redirect(`/login?next=${loginNext}`);
  }

  try {
    const workspace = await loadHirerWorkspace();
    if (workspace) return workspace;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return createPreviewHirerWorkspace({
        kind: "unavailable",
        service: "database",
      });
    }
    throw error;
  }

  if (isLocalUiPreview()) {
    return createPreviewHirerWorkspace({ kind: "unauthenticated" });
  }
  redirect(`/login?next=${loginNext}`);
}

export async function loadHirerWorkspace(): Promise<HirerWorkspace | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  if (!isDatabaseConfigured()) return null;

  const userId = ctx.user.id;
  const displayName = ctx.user.profile?.displayName ?? "Member";
  const handle = ctx.user.profile?.handle ?? "member";
  const avatarUrl = ctx.user.profile?.avatarUrl ?? null;
  const orgId = ctx.user.activeOrganizationId;
  const orgRole =
    ctx.user.memberships.find((m) => m.organizationId === orgId)?.orgRole ??
    null;

  const campaignWhere = orgId
    ? { organizationId: orgId }
    : { clientUserId: userId };

  const [
    organization,
    clientWallet,
    orgWallet,
    campaigns,
    templates,
    platformWorkerCount,
    members,
    invitations,
  ] = await Promise.all([
    orgId
      ? prisma.organization.findUnique({
          where: { id: orgId },
          select: {
            id: true,
            name: true,
            slug: true,
            publicId: true,
            kind: true,
            billingEmail: true,
          },
        })
      : Promise.resolve(null),
    walletRepository.findByOwner({
      kind: "client",
      ownerUserId: userId,
      currency: "NGN",
    }),
    orgId
      ? prisma.wallet.findFirst({
          where: {
            organizationId: orgId,
            kind: { in: ["organization", "client"] },
            currency: "NGN",
          },
          select: { id: true, publicId: true, currency: true, kind: true },
        })
      : Promise.resolve(null),
    prisma.campaign.findMany({
      where: campaignWhere,
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        publicId: true,
        name: true,
        category: true,
        status: true,
        rewardPerUnitMinor: true,
        targetQuantity: true,
        completedQuantity: true,
        approvedQuantity: true,
        reservedBudgetMinor: true,
        spentBudgetMinor: true,
        createdAt: true,
      },
    }),
    prisma.taskTemplate.findMany({
      where: { status: "published", archivedAt: null },
      orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
      take: 40,
      select: { id: true, name: true, category: true, status: true },
    }),
    prisma.userRole.count({
      where: { role: { key: "worker" } },
    }),
    orgId
      ? prisma.organizationMember.findMany({
          where: { organizationId: orgId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: { displayName: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    orgId
      ? prisma.organizationInvitation.findMany({
          where: { organizationId: orgId, status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { id: true, email: true, orgRole: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const campaignIds = campaigns.map((row) => row.id);

  const [submissions, assignmentGroups] = await Promise.all([
    campaignIds.length > 0
      ? prisma.submission.findMany({
          where: {
            assignment: { campaignId: { in: campaignIds } },
            status: {
              in: [
                "submitted",
                "validating",
                "validation_complete",
                "in_review",
                "approved",
                "rejected",
                "revision_requested",
              ],
            },
          },
          orderBy: { submittedAt: "desc" },
          take: 40,
          select: {
            id: true,
            publicId: true,
            status: true,
            submittedAt: true,
            worker: {
              select: {
                profile: { select: { displayName: true, avatarUrl: true } },
              },
            },
            assignment: {
              select: {
                campaign: {
                  select: { name: true, rewardPerUnitMinor: true },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    campaignIds.length > 0
      ? prisma.assignment.groupBy({
          by: ["workerUserId"],
          where: { campaignId: { in: campaignIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const workerIds = assignmentGroups.map((row) => row.workerUserId);
  const workerProfiles =
    workerIds.length > 0
      ? await prisma.profile.findMany({
          where: { userId: { in: workerIds } },
          select: {
            userId: true,
            displayName: true,
            handle: true,
            avatarUrl: true,
          },
        })
      : [];
  const workerById = new Map(workerProfiles.map((row) => [row.userId, row]));

  const walletRow = orgWallet ?? clientWallet;
  let wallet = emptyWallet();
  let transactions: HirerLedgerRow[] = [];

  if (walletRow) {
    const projection = await walletRepository.computeAndStoreProjection(
      walletRow.id,
    );
    wallet = {
      walletId: projection.walletId,
      availableMinor: projection.availableMinor,
      pendingMinor: projection.pendingMinor,
      heldMinor: projection.heldMinor,
      lifetimePaidMinor: projection.lifetimePaidMinor,
      availableLabel: formatNgnFromMinor(projection.availableMinor),
      pendingLabel: formatNgnFromMinor(projection.pendingMinor),
      heldLabel: formatNgnFromMinor(projection.heldMinor),
    };

    const txRows = await prisma.financialTransaction.findMany({
      where: {
        OR: [
          { destinationWalletId: walletRow.id },
          { sourceWalletId: walletRow.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        publicId: true,
        type: true,
        status: true,
        netMinor: true,
        createdAt: true,
      },
    });
    transactions = txRows.map((row) => ({
      id: row.id,
      title: row.publicId,
      amountMinor: row.netMinor,
      type: row.type,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  const org: HirerOrganization | null = organization
    ? {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        publicId: organization.publicId,
        kind: organization.kind,
        billingEmail: organization.billingEmail,
      }
    : null;

  const campaignRows: HirerCampaignRow[] = campaigns.map((row) => ({
    id: row.id,
    publicId: row.publicId,
    name: row.name,
    category: row.category,
    status: row.status,
    rewardPerUnitMinor: row.rewardPerUnitMinor,
    targetQuantity: row.targetQuantity,
    completedQuantity: row.completedQuantity,
    approvedQuantity: row.approvedQuantity,
    reservedBudgetMinor: row.reservedBudgetMinor,
    spentBudgetMinor: row.spentBudgetMinor,
    createdAt: row.createdAt.toISOString(),
  }));

  const pendingReviews: HirerReviewRow[] = submissions.map((row) => ({
    id: row.id,
    publicId: row.publicId,
    status: row.status,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    workerName: row.worker.profile?.displayName ?? "Worker",
    workerAvatarUrl: row.worker.profile?.avatarUrl ?? null,
    campaignName: row.assignment.campaign.name,
    rewardLabel: formatNgnFromMinor(row.assignment.campaign.rewardPerUnitMinor),
  }));

  const workers: HirerWorkerRow[] = assignmentGroups.map((row) => {
    const profile = workerById.get(row.workerUserId);
    return {
      userId: row.workerUserId,
      displayName: profile?.displayName ?? "Worker",
      handle: profile?.handle ?? "member",
      avatarUrl: profile?.avatarUrl ?? null,
      assignmentCount: row._count._all,
    };
  });

  const memberRows: HirerMemberRow[] = members.map((row) => ({
    userId: row.user.id,
    displayName: row.user.profile?.displayName ?? row.user.email ?? "Member",
    email: row.user.email,
    orgRole: row.orgRole,
    status: row.status,
  }));

  const invitationRows: HirerInvitationRow[] = invitations.map((row) => ({
    id: row.id,
    email: row.email,
    orgRole: row.orgRole,
    status: row.status,
  }));

  const templateRows: HirerTemplateOption[] = templates.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    status: row.status,
  }));

  return {
    userId,
    displayName,
    handle,
    avatarUrl,
    organization: org,
    orgRole,
    wallet,
    transactions,
    campaigns: campaignRows,
    pendingReviews,
    workers,
    members: memberRows,
    invitations: invitationRows,
    templates: templateRows,
    platformWorkerCount,
    loadState: { kind: "live" },
  };
}
