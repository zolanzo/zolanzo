"use server";

import type { ApiResponse } from "@/lib/api/response";
import { AppError } from "@/lib/api/response";
import { requireAuthContext } from "@/lib/auth/session";
import { requirePermission } from "@/lib/rbac/guards";
import { assertOrgMember } from "@/lib/auth/resource-guards";
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
  await requirePermission("notifications.send");
  return createNotificationIntent({ input });
}

export async function dispatchNotificationJobAction(
  jobId: string,
  preferLive = true,
): Promise<ApiResponse<NotificationJobRecord>> {
  const ctx = await requirePermission("notifications.send");
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
  const ctx = await requireAuthContext();
  const raw =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  if (raw.scope === "organization") {
    const organizationId =
      typeof raw.organizationId === "string"
        ? raw.organizationId
        : ctx.user.activeOrganizationId;
    if (!organizationId) {
      return {
        ok: false,
        error: { code: "NO_ORG", message: "Organization required" },
      };
    }
    try {
      assertOrgMember(ctx.user, organizationId);
    } catch (error) {
      if (error instanceof AppError) return error.toApiError();
      throw error;
    }
    return upsertNotificationPreference({
      input: { ...raw, organizationId, userId: undefined },
    });
  }

  // User-scoped prefs always bind to the authenticated user (IDOR).
  return upsertNotificationPreference({
    input: { ...raw, scope: "user", userId: ctx.user.id },
  });
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
  const ctx = await requirePermission("notifications.send");
  return emitNotificationFromDomainEvent({
    ...params,
    actorUserId: ctx.user.id,
  });
}
