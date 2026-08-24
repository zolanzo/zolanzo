import "server-only";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getAuthContext, resolveAuthContext } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/validation/env";
import { browseWorkOpportunities } from "@/features/task-marketplace/services";
import { loadWorkerEligibilityContext } from "@/features/task-marketplace/services/worker-context";
import { walletRepository } from "@/features/wallet/services/projection";
import { readOpportunityPreferences } from "@/lib/profile/address-json";
import { formatNgnFromMinor } from "@/lib/money/ngn";
import { SITE_CONFIG } from "@/constants/site";
import { isLocalUiPreview } from "@/lib/dev/local-ui";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";
import { createPreviewEarnerWorkspace } from "@/lib/workspace/preview-workspace";
import type {
  EarnerWorkspace,
  LedgerRow,
  MaskedBankAccount,
  VerificationFlags,
  WalletSnapshot,
  WithdrawalRow,
  WorkerStats,
  EarnerWorkItem,
} from "@/lib/workspace/earner-types";

export type { EarnerWorkspace } from "@/lib/workspace/earner-types";

function emptyWallet(): WalletSnapshot {
  return {
    walletId: null,
    availableMinor: 0,
    pendingMinor: 0,
    heldMinor: 0,
    lifetimeEarnedMinor: 0,
    lifetimePaidMinor: 0,
    availableLabel: formatNgnFromMinor(0),
    pendingLabel: formatNgnFromMinor(0),
  };
}

function maskDestination(details: unknown): {
  last4: string | null;
  bankName: string | null;
} {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return { last4: null, bankName: null };
  }
  const rec = details as Record<string, unknown>;
  const account = String(
    rec.accountNumber ?? rec.account_number ?? rec.nuban ?? "",
  );
  const bankName =
    typeof rec.bankName === "string"
      ? rec.bankName
      : typeof rec.bank_name === "string"
        ? rec.bank_name
        : null;
  return {
    last4: account.length >= 4 ? account.slice(-4) : null,
    bankName,
  };
}

export async function requireEarnerWorkspace(
  loginNext = "/earner/dashboard",
): Promise<EarnerWorkspace> {
  const resolved = await resolveAuthContext();

  if (resolved.status === "unavailable") {
    return createPreviewEarnerWorkspace({
      kind: "unavailable",
      service: resolved.service,
    });
  }

  if (resolved.status === "unauthenticated") {
    if (isLocalUiPreview()) {
      return createPreviewEarnerWorkspace({ kind: "unauthenticated" });
    }
    redirect(`/login?next=${loginNext}`);
  }

  try {
    const workspace = await loadEarnerWorkspace();
    if (workspace) return workspace;
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      return createPreviewEarnerWorkspace({
        kind: "unavailable",
        service: "database",
      });
    }
    throw error;
  }

  if (isLocalUiPreview()) {
    return createPreviewEarnerWorkspace({ kind: "unauthenticated" });
  }
  redirect(`/login?next=${loginNext}`);
}

export async function loadEarnerWorkspace(): Promise<EarnerWorkspace | null> {
  const ctx = await getAuthContext();
  if (!ctx) return null;
  if (!isDatabaseConfigured()) return null;

  const userId = ctx.user.id;
  const handle = ctx.user.profile?.handle ?? "member";
  const displayName = ctx.user.profile?.displayName ?? "Member";

  const [
    userRow,
    profileRow,
    walletRow,
    destination,
    trust,
    assignmentCounts,
    submissionCounts,
    workerContext,
    assignmentRows,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        createdAt: true,
      },
    }),
    prisma.profile.findUnique({ where: { userId } }),
    walletRepository.findByOwner({
      kind: "worker",
      ownerUserId: userId,
      currency: "NGN",
    }),
    prisma.destinationAccount.findFirst({
      where: { workerUserId: userId, active: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trustProfile.findFirst({
      where: { userId },
      orderBy: { lastCalculatedAt: "desc" },
      select: { overallScore: true },
    }),
    prisma.assignment.groupBy({
      by: ["status"],
      where: { workerUserId: userId },
      _count: { _all: true },
    }),
    prisma.submission.groupBy({
      by: ["status"],
      where: { workerUserId: userId },
      _count: { _all: true },
    }),
    loadWorkerEligibilityContext({
      userId,
      organizationIds: ctx.user.activeOrganizationId
        ? [ctx.user.activeOrganizationId]
        : ctx.user.memberships
            .filter((m) => m.status === "active")
            .map((m) => m.organizationId),
    }),
    prisma.assignment.findMany({
      where: { workerUserId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        publicId: true,
        status: true,
        createdAt: true,
        submittedAt: true,
        campaign: { select: { name: true, rewardPerUnitMinor: true } },
        taskInstance: { select: { publicId: true } },
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, submittedAt: true },
        },
      },
    }),
  ]);

  const marketplace = await browseWorkOpportunities({
    input: {
      limit: 24,
      sort: "priority",
      worker: workerContext,
      excludeIneligible: true,
    },
  });

  let wallet = emptyWallet();
  let transactions: LedgerRow[] = [];
  let withdrawals: WithdrawalRow[] = [];

  if (walletRow) {
    const projection = await walletRepository.computeAndStoreProjection(
      walletRow.id,
    );
    wallet = {
      walletId: projection.walletId,
      availableMinor: projection.availableMinor,
      pendingMinor: projection.pendingMinor,
      heldMinor: projection.heldMinor,
      lifetimeEarnedMinor: projection.lifetimeEarnedMinor,
      lifetimePaidMinor: projection.lifetimePaidMinor,
      availableLabel: formatNgnFromMinor(projection.availableMinor),
      pendingLabel: formatNgnFromMinor(projection.pendingMinor),
    };

    const [txRows, withdrawalRows] = await Promise.all([
      prisma.financialTransaction.findMany({
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
          amountMinor: true,
          netMinor: true,
          createdAt: true,
        },
      }),
      prisma.withdrawalRequest.findMany({
        where: { workerUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          publicId: true,
          amountMinor: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    transactions = txRows.map((row) => ({
      id: row.id,
      title: row.publicId,
      amountMinor: row.netMinor,
      type: row.type,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
    withdrawals = withdrawalRows.map((row) => ({
      id: row.id,
      publicId: row.publicId,
      amountMinor: row.amountMinor,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  const totalAssignments = assignmentCounts.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );
  const completedAssignments = assignmentCounts
    .filter((row) => row.status === "completed" || row.status === "approved")
    .reduce((sum, row) => sum + row._count._all, 0);
  const totalSubmissions = submissionCounts.reduce(
    (sum, row) => sum + row._count._all,
    0,
  );
  const approvedSubmissions = submissionCounts
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + row._count._all, 0);

  const stats: WorkerStats = {
    completedAssignments,
    totalAssignments,
    approvedSubmissions,
    totalSubmissions,
    approvalRate:
      totalSubmissions > 0 ? approvedSubmissions / totalSubmissions : null,
    completionRate:
      totalAssignments > 0 ? completedAssignments / totalAssignments : null,
  };

  const masked = destination ? maskDestination(destination.details) : null;
  const bank: MaskedBankAccount | null = destination
    ? {
        id: destination.id,
        label: destination.label,
        verified: destination.verified,
        last4: masked?.last4 ?? null,
        bankName: masked?.bankName ?? null,
      }
    : null;

  const verification: VerificationFlags = {
    email: Boolean(userRow?.emailVerifiedAt),
    phone: Boolean(userRow?.phoneVerifiedAt),
    bank: Boolean(destination?.verified),
    identity: false,
  };

  const opportunities = marketplace.ok ? marketplace.data.items : [];
  const appUrl = SITE_CONFIG.url.replace(/\/$/, "");

  const workItems: EarnerWorkItem[] = assignmentRows.map((row) => ({
    id: row.id,
    assignmentPublicId: row.publicId,
    instancePublicId: row.taskInstance.publicId,
    title: row.campaign.name,
    assignmentStatus: row.status,
    submissionStatus: row.submissions[0]?.status ?? null,
    rewardMinor: row.campaign.rewardPerUnitMinor,
    submittedAt:
      row.submissions[0]?.submittedAt?.toISOString() ??
      row.submittedAt?.toISOString() ??
      null,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    userId: userId,
    email: userRow?.email ?? ctx.user.email,
    phone: userRow?.phone ?? null,
    emailVerified: verification.email,
    phoneVerified: verification.phone,
    memberSince: (userRow?.createdAt ?? new Date()).toISOString(),
    workerPublicId: profileRow?.workerPublicId ?? null,
    displayName,
    handle,
    avatarUrl: profileRow?.avatarUrl ?? ctx.user.profile?.avatarUrl ?? null,
    legalName: profileRow?.legalName ?? null,
    bio: profileRow?.bio ?? null,
    countryCode: profileRow?.countryCode ?? null,
    trustScore: trust?.overallScore ?? null,
    wallet,
    bank,
    transactions,
    withdrawals,
    opportunities,
    stats,
    verification,
    preferences: readOpportunityPreferences(profileRow?.addressJson),
    marketingOptIn: profileRow?.marketingOptIn ?? false,
    referralUrl: `${appUrl}/signup?ref=${encodeURIComponent(handle)}`,
    workItems,
    loadState: { kind: "live" },
  };
}
