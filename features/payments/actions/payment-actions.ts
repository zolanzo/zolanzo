"use server";

import type { ApiResponse } from "@/lib/api/response";
import { AppError } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { assertPaymentIntentAccess } from "@/lib/auth/resource-guards";
import { prisma } from "@/lib/prisma/client";
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
  const intent = await prisma.paymentIntent.findUnique({
    where: { publicId: paymentPublicId },
  });
  if (!intent) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Payment intent not found" },
    };
  }
  try {
    assertPaymentIntentAccess({
      user: ctx.user,
      clientUserId: intent.clientUserId,
      organizationId: intent.organizationId,
    });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    throw error;
  }

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
 * Webhook ingress — no session auth.
 * Signature / timestamp / replay verification runs inside adapter + webhook-auth.
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

export async function requestPaymentRefundAction(
  input: unknown,
): Promise<
  ApiResponse<{
    paymentPublicId: string;
    accepted: boolean;
    providerRefundRef: string | null;
    reason?: string;
  }>
> {
  const { requirePermission } = await import("@/lib/rbac/guards");
  const { requestPaymentRefund } = await import(
    "@/features/payments/services/refunds"
  );
  const ctx = await requirePermission("payments.refund");
  return withServerRequestContext(
    {
      operation: "payment.refund",
      module: "payments",
      userId: ctx.user.id,
    },
    () =>
      requestPaymentRefund({
        input,
        actorUserId: ctx.user.id,
      }),
  );
}
