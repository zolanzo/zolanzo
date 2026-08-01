/**
 * Apply Resend delivery lifecycle events to NotificationJob rows.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { verifyResendWebhook } from "@/lib/integrations/notifications/resend/signature";
import { normalizeResendWebhook } from "@/lib/integrations/notifications/resend/normalize";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import { runWebhookWithContext } from "@/lib/observability/request-context";
import { readCorrelationHeader } from "@/lib/observability/correlation";

export async function handleResendWebhook(params: {
  headers: Record<string, string>;
  body: string;
}): Promise<
  ApiResponse<{
    validSignature: boolean;
    processed: boolean;
    type: string;
    duplicate?: boolean;
  }>
> {
  const inbound = readCorrelationHeader(params.headers);

  return runWebhookWithContext(
    {
      provider: "resend",
      correlationId: inbound,
      operation: "resend.webhook",
    },
    async () => {
      try {
        metrics.webhook({ provider: "resend", outcome: "received" });

        let raw: Record<string, unknown> = {};
        try {
          raw = JSON.parse(params.body) as Record<string, unknown>;
        } catch {
          metrics.webhook({ provider: "resend", outcome: "rejected" });
          throw new AppError("INVALID_BODY", "Invalid JSON body", 400);
        }

        const verified = verifyResendWebhook({
          headers: params.headers,
          body: params.body,
        });
        if (!verified.ok) {
          metrics.webhook({ provider: "resend", outcome: "rejected" });
          throw new AppError(
            "INVALID_SIGNATURE",
            `Resend webhook rejected: ${verified.reason}`,
            401,
          );
        }
        metrics.webhook({ provider: "resend", outcome: "verified" });

        const event = normalizeResendWebhook(raw);
        if (event.type === "unknown") {
          logger.info("Resend unknown event ignored", {
            span: "resend.webhook",
            type: String(raw.type ?? "unknown"),
          });
          return apiSuccess({
            validSignature: true,
            processed: false,
            type: String(raw.type ?? "unknown"),
          });
        }

        if (!event.emailId) {
          return apiSuccess({
            validSignature: true,
            processed: false,
            type: event.type,
          });
        }

        const job = await prisma.notificationJob.findFirst({
          where: {
            providerKey: "resend",
            providerRef: event.emailId,
          },
        });

        if (!job) {
          logger.info("Resend event for unknown email id", {
            span: "resend.webhook",
            type: event.type,
            emailId: event.emailId,
          });
          return apiSuccess({
            validSignature: true,
            processed: false,
            type: event.type,
          });
        }

        const prev = (job.metadata ?? {}) as Record<string, unknown>;
        const seen = Array.isArray(prev.lifecycleEvents)
          ? (prev.lifecycleEvents as string[])
          : [];
        if (seen.includes(event.idempotencyKey)) {
          return apiSuccess({
            validSignature: true,
            processed: true,
            type: event.type,
            duplicate: true,
          });
        }

        const nextMeta = {
          ...prev,
          lifecycleEvents: [...seen, event.idempotencyKey].slice(-50),
          lastLifecycle: {
            type: event.type,
            at: event.occurredAt,
            bounceType: event.bounceType ?? null,
          },
        };

        if (event.type === "email.delivered" || event.type === "email.sent") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: "delivered",
              deliveredAt: job.deliveredAt ?? new Date(event.occurredAt),
              metadata: nextMeta as Prisma.InputJsonValue,
            },
          });
        } else if (event.type === "email.bounced" || event.type === "email.failed") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: "dead_lettered",
              failureDetails: {
                reason: event.type,
                bounceType: event.bounceType,
                source: "resend_webhook",
              } as Prisma.InputJsonValue,
              metadata: nextMeta as Prisma.InputJsonValue,
            },
          });
        } else if (event.type === "email.complained") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: "dead_lettered",
              failureDetails: {
                reason: "complaint",
                source: "resend_webhook",
              } as Prisma.InputJsonValue,
              metadata: nextMeta as Prisma.InputJsonValue,
            },
          });
        } else if (event.type === "email.opened" || event.type === "email.clicked") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              metadata: {
                ...nextMeta,
                openTracked: event.type === "email.opened" ? true : prev.openTracked,
                clickTracked:
                  event.type === "email.clicked" ? true : prev.clickTracked,
              } as Prisma.InputJsonValue,
            },
          });
        } else {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: { metadata: nextMeta as Prisma.InputJsonValue },
          });
        }

        logger.info("Resend lifecycle applied", {
          span: "resend.webhook",
          type: event.type,
          emailId: event.emailId,
          jobId: job.id,
        });

        return apiSuccess({
          validSignature: true,
          processed: true,
          type: event.type,
        });
      } catch (error) {
        if (error instanceof AppError) {
          if (error.code === "WEBHOOK_REPLAY") {
            metrics.webhook({ provider: "resend", outcome: "replay_blocked" });
          }
          return error.toApiError();
        }
        return apiError(
          "RESEND_WEBHOOK_FAILED",
          error instanceof Error ? error.message : "Webhook failed",
        );
      }
    },
  );
}
