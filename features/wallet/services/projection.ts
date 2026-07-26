/**
 * Wallet projection — balances rebuilt from ledger (+ pending settlements).
 * Never mutate balances as source of truth.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { generatePublicId } from "@/lib/public-id/generator";
import type { WalletKind } from "@/constants/wallet-kinds";
import { ledgerRepository } from "@/features/ledger/services/posting";
import { BaseRepository } from "@/repositories/base";

export type WalletProjectionView = {
  walletId: string;
  walletPublicId: string;
  currency: string;
  availableMinor: number;
  pendingMinor: number;
  heldMinor: number;
  lifetimeEarnedMinor: number;
  lifetimePaidMinor: number;
  lifetimeAdjustmentsMinor: number;
  computedAt: string;
};

class WalletRepository extends BaseRepository {
  async findByOwner(params: {
    kind: WalletKind;
    ownerUserId: string;
    currency: string;
  }): Promise<{ id: string; publicId: string; currency: string } | null> {
    const row = await prisma.wallet.findUnique({
      where: {
        kind_ownerUserId_currency: {
          kind: params.kind,
          ownerUserId: params.ownerUserId,
          currency: params.currency,
        },
      },
      select: { id: true, publicId: true, currency: true },
    });
    return row;
  }

  async ensureWorkerWallet(params: {
    ownerUserId: string;
    currency: string;
  }): Promise<{ id: string; publicId: string; currency: string }> {
    const existing = await this.findByOwner({
      kind: "worker",
      ownerUserId: params.ownerUserId,
      currency: params.currency,
    });
    if (existing) return existing;

    const publicId = await generatePublicId("wallet");
    const row = await prisma.wallet.create({
      data: {
        publicId,
        kind: "worker",
        status: "active",
        currency: params.currency,
        ownerUserId: params.ownerUserId,
      },
      select: { id: true, publicId: true, currency: true },
    });
    await prisma.walletProjection.create({
      data: { walletId: row.id },
    });
    return row;
  }

  async computeAndStoreProjection(
    walletId: string,
  ): Promise<WalletProjectionView> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: { id: true, publicId: true, currency: true },
    });
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    const entries = await ledgerRepository.listEntriesForWallet(walletId);
    let available = 0;
    let held = 0;
    let lifetimeEarned = 0;
    let lifetimePaid = 0;
    let lifetimeAdjustments = 0;

    for (const entry of entries) {
      const signed =
        entry.side === "credit" ? entry.amountMinor : -entry.amountMinor;
      if (entry.accountCode === "worker_liability") {
        available += signed;
        if (entry.side === "credit") lifetimeEarned += entry.amountMinor;
      }
      if (entry.accountCode === "withdrawal_clearing") {
        held += entry.side === "credit" ? entry.amountMinor : -entry.amountMinor;
        if (entry.side === "debit") lifetimePaid += entry.amountMinor;
      }
      if (entry.accountCode === "adjustments") {
        // paired with worker_liability; track magnitude of adjustment credits to worker
        if (entry.side === "debit") lifetimeAdjustments += entry.amountMinor;
      }
    }

    const pendingAgg = await prisma.settlement.aggregate({
      where: {
        workerWalletId: walletId,
        status: { in: ["pending", "scheduled", "processing"] },
      },
      _sum: { netMinor: true },
    });
    const pendingMinor = pendingAgg._sum.netMinor ?? 0;

    const reservedAgg = await prisma.withdrawalReservation.aggregate({
      where: { walletId, status: "active" },
      _sum: { amountMinor: true },
    });
    const reservedMinor = reservedAgg._sum.amountMinor ?? 0;

    const heldMinor = Math.max(0, held) + reservedMinor;
    const availableMinor = Math.max(0, available - reservedMinor);

    const computedAt = new Date();
    await prisma.walletProjection.upsert({
      where: { walletId },
      create: {
        walletId,
        availableMinor,
        pendingMinor,
        heldMinor,
        lifetimeEarnedMinor: lifetimeEarned,
        lifetimePaidMinor: lifetimePaid,
        lifetimeAdjustmentsMinor: lifetimeAdjustments,
        computedAt,
      },
      update: {
        availableMinor,
        pendingMinor,
        heldMinor,
        lifetimeEarnedMinor: lifetimeEarned,
        lifetimePaidMinor: lifetimePaid,
        lifetimeAdjustmentsMinor: lifetimeAdjustments,
        computedAt,
      },
    });

    return {
      walletId: wallet.id,
      walletPublicId: wallet.publicId,
      currency: wallet.currency,
      availableMinor,
      pendingMinor,
      heldMinor,
      lifetimeEarnedMinor: lifetimeEarned,
      lifetimePaidMinor: lifetimePaid,
      lifetimeAdjustmentsMinor: lifetimeAdjustments,
      computedAt: computedAt.toISOString(),
    };
  }
}

export const walletRepository = new WalletRepository();

export async function ensureWorkerWallet(params: {
  ownerUserId: string;
  currency: string;
}): Promise<{ id: string; publicId: string; currency: string }> {
  return walletRepository.ensureWorkerWallet(params);
}

export async function projectWallet(
  walletId: string,
): Promise<WalletProjectionView> {
  return walletRepository.computeAndStoreProjection(walletId);
}
