/**
 * Apply Sendchamp delivery lifecycle events to NotificationJob rows.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { verifySendchampWebhook } from "@/lib/integrations/notifications/sendchamp/signature";
import {
  extractSendchampEventId,
  normalizeSendchampWebhook,
} from "@/lib/integrations/notifications/sendchamp/normalize";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";
import { runWebhookWithContext } from "@/lib/observability/request-context";
import { readCorrelationHeader } from "@/lib/observability/correlation";

export async function handleSendchampWebhook(params: {
  headers: Record<string, string>;
  body: string;
}): Promise<
  ApiResponse<{
    validSignature: boolean;
    processed: boolean;
    status: string;
    duplicate?: boolean;
  }>
> {
  const inbound = readCorrelationHeader(params.headers);

  return runWebhookWithContext(
    {
      provider: "sendchamp",
      correlationId: inbound,
      operation: "sendchamp.webhook",
    },
    async () => {
      try {
        metrics.webhook({ provider: "sendchamp", outcome: "received" });

        let raw: Record<string, unknown> = {};
        try {
          raw = JSON.parse(params.body) as Record<string, unknown>;
        } catch {
          metrics.webhook({ provider: "sendchamp", outcome: "rejected" });
          throw new AppError("INVALID_BODY", "Invalid JSON body", 400);
        }

        const eventId = extractSendchampEventId(raw);
        const verified = verifySendchampWebhook({
          headers: params.headers,
          body: params.body,
          eventId,
        });
        if (!verified.ok) {
          metrics.webhook({ provider: "sendchamp", outcome: "rejected" });
          throw new AppError(
            "INVALID_SIGNATURE",
            `Sendchamp webhook rejected: ${verified.reason}`,
            401,
          );
        }
        metrics.webhook({ provider: "sendchamp", outcome: "verified" });

        const event = normalizeSendchampWebhook(raw);
        if (!event.providerRef) {
          return apiSuccess({
            validSignature: true,
            processed: false,
            status: event.status,
          });
        }

        const job = await prisma.notificationJob.findFirst({
          where: {
            providerKey: "sendchamp",
            providerRef: event.providerRef,
          },
        });

        if (!job) {
          logger.info("Sendchamp event for unknown provider ref", {
            span: "sendchamp.webhook",
            status: event.status,
            providerRef: event.providerRef,
          });
          return apiSuccess({
            validSignature: true,
            processed: false,
            status: event.status,
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
            status: event.status,
            duplicate: true,
          });
        }

        const nextMeta = {
          ...prev,
          lifecycleEvents: [...seen, event.idempotencyKey].slice(-50),
          lastLifecycle: {
            status: event.status,
            service: event.service,
            at: event.occurredAt,
          },
        };

        if (event.status === "delivered" || event.status === "sent") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: "delivered",
              deliveredAt: job.deliveredAt ?? new Date(),
              metadata: nextMeta as Prisma.InputJsonValue,
            },
          });
        } else if (event.status === "failed" || event.status === "rejected") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: "dead_lettered",
              failureDetails: {
                reason: event.status,
                source: "sendchamp_webhook",
                service: event.service,
              } as Prisma.InputJsonValue,
              metadata: nextMeta as Prisma.InputJsonValue,
            },
          });
        } else if (event.status === "read") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              metadata: {
                ...nextMeta,
                readTracked: true,
                readAt: event.occurredAt,
              } as Prisma.InputJsonValue,
            },
          });
        } else if (event.status === "queued") {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: {
              status: "queued",
              metadata: nextMeta as Prisma.InputJsonValue,
            },
          });
        } else {
          await prisma.notificationJob.update({
            where: { id: job.id },
            data: { metadata: nextMeta as Prisma.InputJsonValue },
          });
        }

        logger.info("Sendchamp lifecycle applied", {
          span: "sendchamp.webhook",
          status: event.status,
          service: event.service,
          providerRef: event.providerRef,
          jobId: job.id,
        });

        return apiSuccess({
          validSignature: true,
          processed: true,
          status: event.status,
        });
      } catch (error) {
        if (error instanceof AppError) {
          if (error.code === "WEBHOOK_REPLAY") {
            metrics.webhook({
              provider: "sendchamp",
              outcome: "replay_blocked",
            });
          }
          return error.toApiError();
        }
        return apiError(
          "SENDCHAMP_WEBHOOK_FAILED",
          error instanceof Error ? error.message : "Webhook failed",
        );
      }
    },
  );
}
