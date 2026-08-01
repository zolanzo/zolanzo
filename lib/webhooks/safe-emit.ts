/**
 * Fire-and-forget webhook publish — never fails domain flows.
 */

import "server-only";

import { isPublicWebhooksEnabled } from "@/lib/webhooks/config";
import { publishWebhookEvent } from "@/lib/webhooks/webhook-service";
import type { WebhookEventType } from "@/lib/webhooks/types";
import { logger } from "@/lib/observability/logger";

export async function safePublishWebhookEvent(input: {
  event: WebhookEventType;
  data: Record<string, unknown>;
  organizationId?: string | null;
  campaignId?: string | null;
  region?: string | null;
  workerId?: string | null;
  requestId?: string;
  span?: string;
}): Promise<void> {
  if (!isPublicWebhooksEnabled()) return;
  try {
    publishWebhookEvent(input);
  } catch (error) {
    logger.warn("Webhook publish failed", {
      span: input.span ?? "webhooks.domain_emit",
      event: input.event,
      err:
        error instanceof Error
          ? { message: error.message }
          : { message: String(error) },
    });
  }
}
