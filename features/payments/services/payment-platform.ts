/**
 * Payment Platform — domain orchestration over provider adapters.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  PAYMENT_INTENT_PURPOSES,
  PAYMENT_PROVIDER_KEYS,
  type PaymentIntentPurpose,
  type PaymentIntentStatus,
  type PaymentProviderKey,
} from "@/constants/payment";
import type {
  NormalizedPaymentEvent,
  PaymentCapability,
} from "@/lib/integrations/types";
import { selectPaymentAdapter } from "@/lib/integrations/payments";
import { applySuccessfulFunding } from "@/features/payments/services/funding";
import { applyPaymentRefundLedger } from "@/features/payments/services/refunds";
import { safeEmitDomainNotification } from "@/features/notifications/services/safe-emit";
import { readCorrelationHeader } from "@/lib/observability/correlation";
import { logger } from "@/lib/observability/logger";
import {
  getCorrelationId,
  runWebhookWithContext,
} from "@/lib/observability/request-context";
import { metrics } from "@/lib/observability/metrics";
import { z } from "zod";

export type PaymentIntentRecord = {
  id: string;
  publicId: string;
  status: PaymentIntentStatus;
  purpose: PaymentIntentPurpose;
  amountMinor: number;
  currency: string;
  providerKey: string | null;
  providerRef: string | null;
  checkoutUrl: string | null;
  campaignId: string | null;
  reference: string;
};

function mapIntent(row: {
  id: string;
  publicId: string;
  status: string;
  purpose: string;
  amountMinor: number;
  currency: string;
  providerKey: string | null;
  providerRef: string | null;
  checkoutUrl: string | null;
  campaignId: string | null;
  reference: string;
}): PaymentIntentRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    status: row.status as PaymentIntentStatus,
    purpose: row.purpose as PaymentIntentPurpose,
    amountMinor: row.amountMinor,
    currency: row.currency,
    providerKey: row.providerKey,
    providerRef: row.providerRef,
    checkoutUrl: row.checkoutUrl,
    campaignId: row.campaignId,
    reference: row.reference,
  };
}

export const createPaymentIntentSchema = z.object({
  organizationId: z.string().min(1),
  amountMinor: z.number().int().positive(),
  currency: z.string().length(3),
  purpose: z.enum(PAYMENT_INTENT_PURPOSES),
  campaignId: z.string().min(1).optional().nullable(),
  providerKey: z.enum(PAYMENT_PROVIDER_KEYS).optional(),
  requiredCapabilities: z
    .array(
      z.enum([
        "accepts_payments",
        "bank_transfers",
        "refunds",
        "split_payments",
        "recurring_billing",
        "virtual_accounts",
        "webhooks",
        "multi_currency",
        "payouts",
      ]),
    )
    .optional(),
  idempotencyKey: z.string().min(8).max(128),
  returnUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function createDomainPaymentIntent(params: {
  input: unknown;
  clientUserId: string;
}): Promise<ApiResponse<PaymentIntentRecord & { adapterProvider: string }>> {
  try {
    const parsed = createPaymentIntentSchema.parse(params.input);
    const currency = parsed.currency.toUpperCase();

    const existing = await prisma.paymentIntent.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
    });
    if (existing) {
      return apiSuccess({
        ...mapIntent(existing),
        adapterProvider: existing.providerKey ?? "unknown",
      });
    }

    if (parsed.purpose === "campaign_funding" && !parsed.campaignId) {
      throw new AppError(
        "CAMPAIGN_REQUIRED",
        "campaign_funding requires campaignId",
        400,
      );
    }

    if (parsed.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: parsed.campaignId,
          organizationId: parsed.organizationId,
        },
        select: { id: true },
      });
      if (!campaign) {
        throw new AppError("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
      }
    }

    const required: PaymentCapability[] = parsed.requiredCapabilities ?? [
      "accepts_payments",
      "webhooks",
    ];
    const adapter = selectPaymentAdapter({
      providerKey: parsed.providerKey,
      requiredCapabilities: required,
    });

    const publicId = await generatePublicId("payment");
    const reference = `zlnz_${publicId.replace("-", "_").toLowerCase()}`;

    const intent = await prisma.paymentIntent.create({
      data: {
        publicId,
        organizationId: parsed.organizationId,
        clientUserId: params.clientUserId,
        purpose: parsed.purpose,
        amountMinor: parsed.amountMinor,
        currency,
        status: "pending_provider",
        reference,
        campaignId: parsed.campaignId ?? null,
        providerKey: adapter.providerKey,
        idempotencyKey: parsed.idempotencyKey,
        metadata: (parsed.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });

    const session = await adapter.createPaymentIntent({
      amountMinor: parsed.amountMinor,
      currency,
      customerRef: params.clientUserId,
      idempotencyKey: parsed.idempotencyKey,
      paymentPublicId: publicId,
      returnUrl:
        parsed.returnUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""}/api/payments/callback`,
      purpose: parsed.purpose,
      metadata: {
        paymentPublicId: publicId,
        organizationId: parsed.organizationId,
        campaignId: parsed.campaignId ?? "",
        correlationId: getCorrelationId() ?? "",
      },
    });

    const updated = await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "awaiting_payment",
        providerRef: session.providerRef,
        checkoutUrl: session.checkoutUrl ?? null,
      },
    });

    await prisma.paymentEvent.create({
      data: {
        paymentIntentId: updated.id,
        type: "payment.initiated",
        providerKey: adapter.providerKey,
        providerRef: session.providerRef,
        idempotencyKey: `${adapter.providerKey}:${session.providerRef}:payment.initiated`,
        amountMinor: parsed.amountMinor,
        currency,
        payload: (session.raw ?? {}) as Prisma.InputJsonValue,
        occurredAt: new Date(),
        processed: true,
      },
    });

    metrics.payment({
      outcome: "initiated",
      provider: adapter.providerKey,
    });
    return apiSuccess({
      ...mapIntent(updated),
      adapterProvider: adapter.providerKey,
    });
  } catch (error) {
    metrics.payment({ outcome: "failed" });
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "PAYMENT_INTENT_FAILED",
      error instanceof Error ? error.message : "Could not create payment intent",
    );
  }
}

async function processSucceededEvent(
  event: NormalizedPaymentEvent,
  paymentIntentId: string,
): Promise<void> {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntentId },
  });
  if (!intent) return;
  if (intent.status === "succeeded") return;

  const adapter = selectPaymentAdapter({
    providerKey: (intent.providerKey as PaymentProviderKey) ?? "memory",
  });

  const verification = await adapter.verifyPayment({
    providerRef: event.providerRef,
    amountMinor: intent.amountMinor,
    currency: intent.currency,
  });

  if (
    event.amountMinor > 0 &&
    event.amountMinor !== intent.amountMinor
  ) {
    logger.warn("Payment amount mismatch — rejecting ledger write", {
      span: "payment.webhook",
      paymentPublicId: intent.publicId,
      intentAmount: intent.amountMinor,
      eventAmount: event.amountMinor,
    });
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "failed" },
    });
    return;
  }

  if (
    event.currency &&
    event.currency.toUpperCase() !== intent.currency.toUpperCase()
  ) {
    logger.warn("Payment currency mismatch — rejecting ledger write", {
      span: "payment.webhook",
      paymentPublicId: intent.publicId,
      intentCurrency: intent.currency,
      eventCurrency: event.currency,
    });
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "failed" },
    });
    return;
  }

  const record = await prisma.paymentRecord.upsert({
    where: {
      providerKey_providerTransactionId: {
        providerKey: event.provider,
        providerTransactionId: event.providerRef,
      },
    },
    create: {
      paymentIntentId: intent.id,
      providerKey: event.provider,
      providerTransactionId: event.providerRef,
      status: verification.verified ? "verified" : "failed",
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      verificationSnapshot: verification.snapshot as Prisma.InputJsonValue,
      verifiedAt: verification.verified ? new Date() : null,
    },
    update: {
      status: verification.verified ? "verified" : "failed",
      verificationSnapshot: verification.snapshot as Prisma.InputJsonValue,
      verifiedAt: verification.verified ? new Date() : null,
    },
  });

  if (!verification.verified) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "failed" },
    });
    return;
  }

  const funding = await applySuccessfulFunding({
    paymentIntentId: intent.id,
    paymentPublicId: intent.publicId,
    amountMinor: intent.amountMinor,
    currency: intent.currency,
    organizationId: intent.organizationId,
    campaignId: intent.campaignId,
    providerKey: event.provider,
    providerRef: event.providerRef,
    idempotencyKey: intent.idempotencyKey,
  });

  await prisma.paymentRecord.update({
    where: { id: record.id },
    data: { ledgerTransactionId: funding.captureTransactionId },
  });

  await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: { status: "succeeded", completedAt: new Date() },
  });

  const amountLabel = `${(intent.amountMinor / 100).toFixed(2)} ${intent.currency}`;
  const client = await prisma.user.findUnique({
    where: { id: intent.clientUserId },
    select: {
      email: true,
      phone: true,
      profile: { select: { displayName: true } },
    },
  });

  await safeEmitDomainNotification({
    event: "payment.receipt",
    organizationId: intent.organizationId,
    actorUserId: intent.clientUserId,
    recipients: [
      {
        role: "client",
        userId: intent.clientUserId,
        email: client?.email ?? null,
        phone: client?.phone ?? null,
        displayName: client?.profile?.displayName ?? null,
      },
    ],
    variables: {
      recipientName: client?.profile?.displayName ?? "there",
      organizationName: "Zolanzo",
      publicRef: intent.publicId,
      amountLabel,
    },
    idempotencyKey: `payment.receipt:${intent.publicId}`,
    channels: ["email", "sms", "in_app"],
    span: "payment.webhook",
  });

  if (intent.campaignId && intent.purpose === "campaign_funding") {
    await safeEmitDomainNotification({
      event: "campaign.funded",
      organizationId: intent.organizationId,
      actorUserId: intent.clientUserId,
      recipients: [
        { role: "client", userId: intent.clientUserId },
      ],
      variables: {
        amountLabel,
        publicRef: intent.publicId,
        recipientName: client?.profile?.displayName ?? "there",
        organizationName: "Zolanzo",
      },
      idempotencyKey: `campaign.funded:${intent.publicId}`,
      channels: ["in_app"],
      span: "payment.webhook",
    });
  }
}

async function ingestNormalizedEvent(
  event: NormalizedPaymentEvent,
): Promise<{ processed: boolean; duplicate: boolean }> {
  const existing = await prisma.paymentEvent.findUnique({
    where: { idempotencyKey: event.idempotencyKey },
  });
  if (existing?.processed) {
    return { processed: true, duplicate: true };
  }

  const intent =
    (event.paymentPublicId
      ? await prisma.paymentIntent.findUnique({
          where: { publicId: event.paymentPublicId },
        })
      : null) ??
    (await prisma.paymentIntent.findFirst({
      where: { providerRef: event.providerRef },
    }));

  const row =
    existing ??
    (await prisma.paymentEvent.create({
      data: {
        paymentIntentId: intent?.id ?? null,
        type: event.type,
        providerKey: event.provider,
        providerRef: event.providerRef,
        idempotencyKey: event.idempotencyKey,
        amountMinor: event.amountMinor,
        currency: event.currency,
        payload: event.raw as Prisma.InputJsonValue,
        occurredAt: new Date(event.occurredAt),
        processed: false,
      },
    }));

  if (!intent) {
    await prisma.paymentEvent.update({
      where: { id: row.id },
      data: { processed: true },
    });
    return { processed: true, duplicate: false };
  }

  if (event.type === "payment.succeeded") {
    await processSucceededEvent(event, intent.id);
    metrics.payment({ outcome: "completed", provider: event.provider });
  } else if (event.type === "payment.failed") {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "failed" },
    });
    metrics.payment({ outcome: "failed", provider: event.provider });
  } else if (event.type === "payment.refunded") {
    await processRefundedEvent(event, intent.id);
  } else if (
    event.type === "transfer.succeeded" ||
    event.type === "transfer.failed" ||
    event.type === "subscription.created" ||
    event.type === "subscription.disabled" ||
    event.type === "invoice.created" ||
    event.type === "invoice.payment_failed"
  ) {
    logger.info("Payment provider lifecycle event recorded", {
      span: "payment.webhook",
      type: event.type,
      provider: event.provider,
      providerRef: event.providerRef,
      correlationId: getCorrelationId(),
    });
  }
  // chargeback: placeholder — store event only

  await prisma.paymentEvent.update({
    where: { id: row.id },
    data: { processed: true, paymentIntentId: intent.id },
  });

  return { processed: true, duplicate: false };
}

async function processRefundedEvent(
  event: NormalizedPaymentEvent,
  paymentIntentId: string,
): Promise<void> {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: paymentIntentId },
  });
  if (!intent) return;

  const amountMinor =
    event.amountMinor > 0 ? event.amountMinor : intent.amountMinor;

  await prisma.paymentRecord.updateMany({
    where: {
      providerKey: event.provider,
      providerTransactionId: event.providerRef,
    },
    data: { status: "refunded" },
  });

  await applyPaymentRefundLedger({
    paymentIntentId: intent.id,
    paymentPublicId: intent.publicId,
    amountMinor,
    currency: intent.currency,
    organizationId: intent.organizationId,
    campaignId: intent.campaignId,
    providerKey: event.provider,
    providerRef: event.providerRef,
    idempotencyKey: `${intent.idempotencyKey}:refund:${amountMinor}`,
  });

  metrics.payment({ outcome: "refunded", provider: event.provider });
}

export const handleWebhookSchema = z.object({
  providerKey: z.enum(PAYMENT_PROVIDER_KEYS),
  headers: z.record(z.string(), z.string()),
  body: z.string().min(1),
});

export async function handlePaymentWebhook(params: {
  input: unknown;
}): Promise<
  ApiResponse<{
    validSignature: boolean;
    eventsProcessed: number;
    duplicates: number;
  }>
> {
  const preview =
    typeof params.input === "object" && params.input !== null
      ? (params.input as {
          headers?: Record<string, string>;
          providerKey?: string;
        })
      : {};
  const inbound = preview.headers
    ? readCorrelationHeader(preview.headers)
    : null;

  return runWebhookWithContext(
    {
      provider: preview.providerKey ?? "payment",
      correlationId: inbound,
      operation: "payment.webhook",
    },
    async () => {
      try {
        const parsed = handleWebhookSchema.parse(params.input);
        const adapter = selectPaymentAdapter({
          providerKey: parsed.providerKey,
        });
        const parsedWebhook = await adapter.parseWebhook(
          parsed.headers,
          parsed.body,
        );

        if (!parsedWebhook.validSignature) {
          throw new AppError(
            "INVALID_SIGNATURE",
            "Webhook signature invalid",
            401,
          );
        }

        let eventsProcessed = 0;
        let duplicates = 0;
        for (const event of parsedWebhook.events) {
          const result = await ingestNormalizedEvent(event);
          if (result.duplicate) duplicates += 1;
          else if (result.processed) eventsProcessed += 1;
        }

        logger.info("Payment webhook processed", {
          span: "payment.webhook",
          eventsProcessed,
          duplicates,
          providerKey: parsed.providerKey,
          outcome: "ok",
        });

        return apiSuccess({
          validSignature: true,
          eventsProcessed,
          duplicates,
        });
      } catch (error) {
        logger.warn("Payment webhook failed", {
          span: "payment.webhook",
          outcome: "error",
          errorCode:
            error instanceof AppError ? error.code : "WEBHOOK_FAILED",
        });
        if (error instanceof AppError) return error.toApiError();
        return apiError(
          "WEBHOOK_FAILED",
          error instanceof Error ? error.message : "Webhook handling failed",
        );
      }
    },
  );
}

export const verifyPaymentSchema = z.object({
  paymentPublicId: z.string().min(1),
});

export async function verifyAndCompletePayment(params: {
  input: unknown;
}): Promise<ApiResponse<PaymentIntentRecord>> {
  try {
    const parsed = verifyPaymentSchema.parse(params.input);
    const intent = await prisma.paymentIntent.findUnique({
      where: { publicId: parsed.paymentPublicId },
    });
    if (!intent) throw new AppError("NOT_FOUND", "Payment intent not found", 404);
    if (!intent.providerRef || !intent.providerKey) {
      throw new AppError("NO_PROVIDER_SESSION", "Provider session missing", 400);
    }

    const event: NormalizedPaymentEvent = {
      type: "payment.succeeded",
      provider: intent.providerKey,
      providerRef: intent.providerRef,
      paymentPublicId: intent.publicId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      occurredAt: new Date().toISOString(),
      idempotencyKey: `${intent.providerKey}:${intent.providerRef}:payment.succeeded:verify`,
      raw: { source: "verify_api" },
    };

    await ingestNormalizedEvent(event);
    const updated = await prisma.paymentIntent.findUniqueOrThrow({
      where: { id: intent.id },
    });
    return apiSuccess(mapIntent(updated));
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "VERIFY_FAILED",
      error instanceof Error ? error.message : "Verification failed",
    );
  }
}
