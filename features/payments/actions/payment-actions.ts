"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import {
  createDomainPaymentIntent,
  handlePaymentWebhook,
  verifyAndCompletePayment,
  type PaymentIntentRecord,
} from "@/features/payments/services/payment-platform";
import { withServerRequestContext } from "@/lib/observability/with-server-context";

export async function createPaymentIntentAction(
  input: unknown,
): Promise<ApiResponse<PaymentIntentRecord & { adapterProvider: string }>> {
  const ctx = await requireAuthContext();
  return withServerRequestContext(
    {
      operation: "payment.create_intent",
      module: "payments",
      userId: ctx.user.id,
      organizationId: ctx.user.activeOrganizationId ?? undefined,
      clientId: ctx.user.id,
    },
    () =>
      createDomainPaymentIntent({
        input,
        clientUserId: ctx.user.id,
      }),
  );
}

export async function verifyPaymentAction(
  paymentPublicId: string,
): Promise<ApiResponse<PaymentIntentRecord>> {
  const ctx = await requireAuthContext();
  return withServerRequestContext(
    {
      operation: "payment.verify",
      module: "payments",
      userId: ctx.user.id,
    },
    () => verifyAndCompletePayment({ input: { paymentPublicId } }),
  );
}

/**
 * Webhook ingress — typically called from a route handler without session auth.
 * Signature verification is performed by the provider adapter.
 * Correlation is established inside handlePaymentWebhook from inbound headers.
 */
export async function handlePaymentWebhookAction(
  input: unknown,
): Promise<
  ApiResponse<{
    validSignature: boolean;
    eventsProcessed: number;
    duplicates: number;
  }>
> {
  return handlePaymentWebhook({ input });
}
