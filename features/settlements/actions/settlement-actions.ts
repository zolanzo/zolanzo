"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
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
  await requireAuthContext();
  return createSettlementFromReview({ input });
}

export async function processSettlementAction(
  settlementPublicId: string,
): Promise<ApiResponse<SettlementRecord>> {
  await requireAuthContext();
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
  await requireAuthContext();
  return processSettlementBatch({ input: { batchPublicId } });
}

const projectWalletSchema = z.object({
  walletId: z.string().min(1),
});

export async function projectWalletAction(
  walletId: string,
): Promise<ApiResponse<WalletProjectionView>> {
  await requireAuthContext();
  projectWalletSchema.parse({ walletId });
  try {
    const view = await projectWallet(walletId);
    return { ok: true, data: view };
  } catch (error) {
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
