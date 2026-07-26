"use server";

import type { ApiResponse } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import {
  createNotificationIntent,
  dispatchNotificationJob,
  emitNotificationFromDomainEvent,
  upsertNotificationPreference,
  type NotificationIntentRecord,
  type NotificationJobRecord,
} from "@/features/notifications/services/notification-hub";
import type { RecipientHint } from "@/features/notifications/services/recipients";
import type {
  NotificationChannel,
  NotificationHubEvent,
} from "@/constants/notification";
import { withServerRequestContext } from "@/lib/observability/with-server-context";

export async function createNotificationIntentAction(
  input: unknown,
): Promise<
  ApiResponse<
    NotificationIntentRecord & {
      jobs: Array<{ id: string; channel: string; status: string }>;
    }
  >
> {
  await requireAuthContext();
  return createNotificationIntent({ input });
}

export async function dispatchNotificationJobAction(
  jobId: string,
  preferLive = true,
): Promise<ApiResponse<NotificationJobRecord>> {
  const ctx = await requireAuthContext();
  return withServerRequestContext(
    {
      operation: "notification.dispatch",
      module: "notifications",
      userId: ctx.user.id,
    },
    () => dispatchNotificationJob({ input: { jobId, preferLive } }),
  );
}

export async function upsertNotificationPreferenceAction(
  input: unknown,
): Promise<ApiResponse<{ subjectKey: string; scope: string }>> {
  await requireAuthContext();
  return upsertNotificationPreference({ input });
}

/**
 * Domain-facing emit helper — features call this instead of channel providers.
 */
export async function emitNotificationAction(params: {
  event: NotificationHubEvent;
  organizationId?: string | null;
  recipients: RecipientHint[];
  variables: Record<string, string>;
  idempotencyKey: string;
  channels?: NotificationChannel[];
  policyKey?: string;
  dispatchNow?: boolean;
}): Promise<
  ApiResponse<
    NotificationIntentRecord & {
      jobs: Array<{ id: string; channel: string; status: string }>;
    }
  >
> {
  const ctx = await requireAuthContext();
  return emitNotificationFromDomainEvent({
    ...params,
    actorUserId: ctx.user.id,
  });
}
