"use server";

import { requireAuthContext } from "@/lib/auth/session";
import { apiError, type ApiResponse } from "@/lib/api/response";
import { createDomainPaymentIntent } from "@/features/payments/services/payment-platform";
import { nairaToMinor } from "@/lib/money/ngn";
import type { PaymentIntentRecord } from "@/features/payments/services/payment-platform";

export async function fundHirerWalletAction(input: {
  amountNaira: number;
}): Promise<ApiResponse<PaymentIntentRecord & { adapterProvider: string }>> {
  const ctx = await requireAuthContext();
  const organizationId = ctx.user.activeOrganizationId;
  if (!organizationId) {
    return apiError(
      "NO_ORG",
      "Join or create an organization before funding a hirer wallet.",
    );
  }
  if (!Number.isFinite(input.amountNaira) || input.amountNaira <= 0) {
    return apiError("INVALID_AMOUNT", "Enter an amount greater than zero.");
  }

  return createDomainPaymentIntent({
    clientUserId: ctx.user.id,
    input: {
      organizationId,
      amountMinor: nairaToMinor(input.amountNaira),
      currency: "NGN",
      purpose: "organization_funding",
      idempotencyKey: `hirer-fund-${ctx.user.id}-${Date.now()}`,
    },
  });
}
