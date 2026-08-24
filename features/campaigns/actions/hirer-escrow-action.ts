"use server";

import { requireAuthContext } from "@/lib/auth/session";
import { zolanzoEngine } from "@/lib/engine/business-engine";
import { apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";

export async function lockHirerEscrowAction(input: {
  campaignId: string;
  subtotal: number;
  platformFee: number;
}): Promise<ApiResponse<{ campaignId: string }>> {
  try {
    const ctx = await requireAuthContext();
    await zolanzoEngine.lockCampaignEscrow(
      input.campaignId,
      ctx.user.id,
      input.subtotal,
      input.platformFee,
    );
    return apiSuccess({ campaignId: input.campaignId });
  } catch (error) {
    return apiError(
      "ESCROW_LOCK_FAILED",
      error instanceof Error ? error.message : "Could not lock escrow",
    );
  }
}
