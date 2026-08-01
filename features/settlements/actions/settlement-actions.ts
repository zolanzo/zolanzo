"use server";

import type { ApiResponse } from "@/lib/api/response";
import { AppError } from "@/lib/api/response";
import { requirePermission } from "@/lib/rbac/guards";
import { assertWalletAccess } from "@/lib/auth/resource-guards";
import { prisma } from "@/lib/prisma/client";
import type { SettlementRecord } from "@/features/settlements/services/settlement-service";
import {
  createSettlementFromReview,
  processSettlement,
  processSettlementBatch,
} from "@/features/settlements/services/settlement-service";
import {
  projectWallet,
  type WalletProjectionView,
} from "@/features/wallet/services/projection";
import { z } from "zod";

export async function createSettlementFromReviewAction(
  input: unknown,
): Promise<ApiResponse<SettlementRecord>> {
  await requirePermission("ops.finance.act");
  return createSettlementFromReview({ input });
}

export async function processSettlementAction(
  settlementPublicId: string,
): Promise<ApiResponse<SettlementRecord>> {
  await requirePermission("ops.finance.act");
  return processSettlement({ input: { settlementPublicId } });
}

export async function processSettlementBatchAction(
  batchPublicId: string,
): Promise<
  ApiResponse<{
    batchPublicId: string;
    status: string;
    processed: number;
    failed: number;
  }>
> {
  await requirePermission("ops.finance.act");
  return processSettlementBatch({ input: { batchPublicId } });
}

const projectWalletSchema = z.object({
  walletId: z.string().min(1),
});

export async function projectWalletAction(
  walletId: string,
): Promise<ApiResponse<WalletProjectionView>> {
  const ctx = await requirePermission("wallet.read");
  projectWalletSchema.parse({ walletId });
  try {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      throw new AppError("NOT_FOUND", "Wallet not found", 404);
    }
    assertWalletAccess({
      user: ctx.user,
      ownerUserId: wallet.ownerUserId,
      organizationId: wallet.organizationId,
    });
    const view = await projectWallet(walletId);
    return { ok: true, data: view };
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return {
      ok: false,
      error: {
        code: "PROJECT_FAILED",
        message:
          error instanceof Error ? error.message : "Could not project wallet",
      },
    };
  }
}
