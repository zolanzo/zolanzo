/**
 * Fire-and-forget domain → notification hub emit.
 * Never throws into business flows; logs and continues.
 */

import "server-only";

import type { NotificationChannel } from "@/constants/notification";
import type { NotificationHubEvent } from "@/constants/notification";
import { emitNotificationFromDomainEvent } from "@/features/notifications/services/notification-hub";
import type { RecipientHint } from "@/features/notifications/services/recipients";
import { logger } from "@/lib/observability/logger";

export async function safeEmitDomainNotification(params: {
  event: NotificationHubEvent;
  organizationId?: string | null;
  actorUserId?: string | null;
  recipients: RecipientHint[];
  variables: Record<string, string>;
  idempotencyKey: string;
  channels?: NotificationChannel[];
  dispatchNow?: boolean;
  span?: string;
}): Promise<void> {
  try {
    await emitNotificationFromDomainEvent({
      event: params.event,
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      recipients: params.recipients,
      variables: params.variables,
      idempotencyKey: params.idempotencyKey,
      channels: params.channels,
      dispatchNow: params.dispatchNow ?? false,
    });
  } catch (error) {
    logger.warn("Domain notification emit failed", {
      span: params.span ?? "notification.domain_emit",
      event: params.event,
      idempotencyKey: params.idempotencyKey,
      err:
        error instanceof Error
          ? { message: error.message }
          : { message: String(error) },
    });
  }
}
