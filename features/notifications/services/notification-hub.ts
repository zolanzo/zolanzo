/**
 * Notification Hub — intents → preference/policy → jobs → channel adapters.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ApiResponse } from "@/lib/api/response";
import { apiError, apiSuccess, AppError } from "@/lib/api/response";
import { metrics } from "@/lib/observability/metrics";
import { generatePublicId } from "@/lib/public-id/generator";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_HUB_EVENTS,
  NOTIFICATION_PRIORITIES,
  type NotificationChannel,
  type NotificationHubEvent,
  type NotificationIntentStatus,
  type NotificationJobStatus,
  type RecipientRole,
} from "@/constants/notification";
import {
  DEFAULT_ADAPTER_BY_CHANNEL,
  selectNotificationAdapter,
} from "@/lib/integrations/notifications";
import {
  buildPolicySnapshot,
  computeRetrySchedule,
  DEFAULT_POLICY,
  evaluateDeliverySchedule,
  type DeliveryPolicyConfig,
  type PolicySnapshot,
} from "@/features/notifications/services/policies";
import {
  defaultUserPreference,
  filterChannelsByPreference,
  mergePreferences,
  parsePreferenceRow,
  preferenceSubjectKey,
  type ResolvedNotificationPreference,
} from "@/features/notifications/services/preferences";
import {
  addressForChannel,
  resolveRecipients,
  type RecipientHint,
  type ResolvedRecipient,
} from "@/features/notifications/services/recipients";
import {
  findBuiltinTemplate,
  renderNotificationTemplate,
  templateKeyForEvent,
} from "@/features/notifications/services/templates";
import {
  resolveFallbackChannels,
  shouldAttemptSmsEmailFallback,
} from "@/features/notifications/services/fallback";
import { z } from "zod";

export type NotificationIntentRecord = {
  id: string;
  publicId: string;
  event: NotificationHubEvent;
  status: NotificationIntentStatus;
  templateKey: string;
  jobCount: number;
};

export type NotificationJobRecord = {
  id: string;
  intentPublicId: string;
  channel: NotificationChannel;
  status: NotificationJobStatus;
  attempts: number;
  scheduledAt: string;
  deliveredAt: string | null;
  providerKey: string | null;
  providerRef: string | null;
};

const recipientHintSchema = z.object({
  role: z.enum([
    "worker",
    "client",
    "organization_member",
    "reviewer",
    "admin",
  ]),
  userId: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(5).optional().nullable(),
  pushToken: z.string().min(1).optional().nullable(),
  webhookUrl: z.string().url().optional().nullable(),
  displayName: z.string().optional().nullable(),
});

export const createNotificationIntentSchema = z.object({
  event: z.enum(NOTIFICATION_HUB_EVENTS),
  organizationId: z.string().min(1).optional().nullable(),
  actorUserId: z.string().min(1).optional().nullable(),
  recipients: z.array(recipientHintSchema).min(1),
  channels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1).optional(),
  variables: z.record(z.string(), z.string()),
  policyKey: z.string().min(1).optional(),
  policy: z
    .object({
      mode: z.enum([
        "immediate",
        "delayed",
        "scheduled",
        "retry",
        "quiet_hours",
        "batch",
        "digest",
      ]),
      delaySeconds: z.number().int().nonnegative().optional(),
      scheduledAt: z.string().datetime().optional(),
      quietHours: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      retry: z
        .object({
          maxAttempts: z.number().int().positive(),
          backoffSeconds: z.number().int().positive(),
        })
        .optional(),
      digestFrequency: z.enum(["none", "daily", "weekly"]).optional(),
      batchWindowSeconds: z.number().int().positive().optional(),
    })
    .optional(),
  priority: z.enum(NOTIFICATION_PRIORITIES).optional(),
  idempotencyKey: z.string().min(8).max(128),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  /** When true, dispatch due jobs immediately via memory adapter */
  dispatchNow: z.boolean().optional(),
});

export const upsertPreferenceSchema = z.object({
  scope: z.enum(["user", "organization"]),
  userId: z.string().min(1).optional().nullable(),
  organizationId: z.string().min(1).optional().nullable(),
  enabledChannels: z.array(z.enum(NOTIFICATION_CHANNELS)).min(1),
  quietHoursStart: z.string().optional().nullable(),
  quietHoursEnd: z.string().optional().nullable(),
  timezone: z.string().min(1).default("UTC"),
  locale: z.string().min(2).default("en"),
  eventSubscriptions: z
    .array(z.enum(NOTIFICATION_HUB_EVENTS))
    .optional()
    .nullable(),
  digestFrequency: z.enum(["none", "daily", "weekly"]).default("none"),
  dndWindows: z
    .array(z.object({ start: z.string(), end: z.string() }))
    .optional()
    .nullable(),
});

export const dispatchJobSchema = z.object({
  jobId: z.string().min(1),
  preferLive: z.boolean().optional(),
});

async function loadPreference(params: {
  userId?: string | null;
  organizationId?: string | null;
}): Promise<ResolvedNotificationPreference> {
  const [userRow, orgRow] = await Promise.all([
    params.userId
      ? prisma.notificationPreference.findUnique({
          where: { subjectKey: preferenceSubjectKey("user", params.userId) },
        })
      : Promise.resolve(null),
    params.organizationId
      ? prisma.notificationPreference.findUnique({
          where: {
            subjectKey: preferenceSubjectKey("organization", params.organizationId),
          },
        })
      : Promise.resolve(null),
  ]);

  return mergePreferences({
    user: userRow
      ? parsePreferenceRow(userRow)
      : params.userId
        ? defaultUserPreference(params.userId)
        : null,
    organization: orgRow ? parsePreferenceRow(orgRow) : null,
  });
}

async function resolvePolicyConfig(params: {
  policyKey?: string;
  policy?: DeliveryPolicyConfig;
}): Promise<{ key: string; config: DeliveryPolicyConfig }> {
  if (params.policy) {
    return { key: params.policyKey ?? params.policy.mode, config: params.policy };
  }

  const key = params.policyKey ?? "immediate";
  const row = await prisma.deliveryPolicy.findUnique({ where: { key } });
  if (!row) {
    return { key: "immediate", config: DEFAULT_POLICY };
  }
  const config = row.config as DeliveryPolicyConfig;
  return {
    key: row.key,
    config: {
      ...DEFAULT_POLICY,
      ...config,
      mode: (row.mode as DeliveryPolicyConfig["mode"]) ?? config.mode,
    },
  };
}

function mapIntent(
  row: {
    id: string;
    publicId: string;
    event: string;
    status: string;
    templateKey: string;
  },
  jobCount: number,
): NotificationIntentRecord {
  return {
    id: row.id,
    publicId: row.publicId,
    event: row.event as NotificationHubEvent,
    status: row.status as NotificationIntentStatus,
    templateKey: row.templateKey,
    jobCount,
  };
}

export async function createNotificationIntent(params: {
  input: unknown;
}): Promise<
  ApiResponse<
    NotificationIntentRecord & {
      jobs: Array<{ id: string; channel: string; status: string }>;
    }
  >
> {
  try {
    const parsed = createNotificationIntentSchema.parse(params.input);

    const existing = await prisma.notificationIntent.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
      include: { jobs: { select: { id: true, channel: true, status: true } } },
    });
    if (existing) {
      return apiSuccess({
        ...mapIntent(existing, existing.jobs.length),
        jobs: existing.jobs,
      });
    }

    const recipients = resolveRecipients(parsed.recipients as RecipientHint[]);
    if (recipients.length === 0) {
      throw new AppError("NO_RECIPIENTS", "No recipients resolved", 400);
    }

    const requestedChannels =
      parsed.channels ?? (["email", "in_app"] as NotificationChannel[]);
    const policyResolved = await resolvePolicyConfig({
      policyKey: parsed.policyKey,
      policy: parsed.policy as DeliveryPolicyConfig | undefined,
    });

    const templateKey = templateKeyForEvent(parsed.event);
    const jobPlans: Array<{
      recipient: ResolvedRecipient;
      channel: NotificationChannel;
      preference: ResolvedNotificationPreference;
      rendered: ReturnType<typeof renderNotificationTemplate>;
      schedule: ReturnType<typeof evaluateDeliverySchedule>;
      policySnapshot: PolicySnapshot;
    }> = [];

    for (const recipient of recipients) {
      const preference = await loadPreference({
        userId: recipient.userId,
        organizationId: parsed.organizationId,
      });

      const channels = filterChannelsByPreference({
        preference,
        requested: requestedChannels,
        event: parsed.event,
      });

      const scheduleBase = evaluateDeliverySchedule({
        policy: {
          ...policyResolved.config,
          quietHours:
            policyResolved.config.quietHours ?? preference.quietHours ?? undefined,
        },
        timezone: preference.timezone,
        dndWindows: preference.dndWindows,
      });

      if (preference.digestFrequency !== "none" && policyResolved.config.mode === "digest") {
        // Digest mode: still create jobs but mark deferred — future dispatcher aggregates.
      }

      for (const channel of channels) {
        const address = addressForChannel(recipient)[channel];
        if (!address) continue;

        const template = findBuiltinTemplate({
          event: parsed.event,
          channel,
          locale: preference.locale,
        });
        if (!template) {
          throw new AppError(
            "TEMPLATE_MISSING",
            `No template for ${parsed.event}/${channel}`,
            400,
          );
        }

        const variables: Record<string, string> = {
          recipientName: recipient.displayName,
          organizationName:
            parsed.variables.organizationName ?? "ZOLANZO",
          publicRef: parsed.variables.publicRef ?? "—",
          event: parsed.event,
          ...parsed.variables,
        };

        const rendered = renderNotificationTemplate({ template, variables });
        const policySnapshot = buildPolicySnapshot({
          policyKey: policyResolved.key,
          policy: policyResolved.config,
          timezone: preference.timezone,
        });

        jobPlans.push({
          recipient,
          channel,
          preference,
          rendered,
          schedule: scheduleBase,
          policySnapshot,
        });
      }
    }

    if (jobPlans.length === 0) {
      const publicId = await generatePublicId("notification");
      const suppressed = await prisma.notificationIntent.create({
        data: {
          publicId,
          event: parsed.event,
          organizationId: parsed.organizationId ?? null,
          actorUserId: parsed.actorUserId ?? null,
          templateKey,
          variables: parsed.variables as Prisma.InputJsonValue,
          recipientSnapshot: recipients as unknown as Prisma.InputJsonValue,
          policySnapshot: buildPolicySnapshot({
            policyKey: policyResolved.key,
            policy: policyResolved.config,
            timezone: "UTC",
          }) as unknown as Prisma.InputJsonValue,
          status: "suppressed",
          idempotencyKey: parsed.idempotencyKey,
          metadata: (parsed.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });
      return apiSuccess({
        ...mapIntent(suppressed, 0),
        jobs: [],
      });
    }

    const publicId = await generatePublicId("notification");
    const priority = parsed.priority ?? "normal";
    const primaryPolicy = jobPlans[0]!.policySnapshot;

    const result = await prisma.$transaction(async (tx) => {
      const intent = await tx.notificationIntent.create({
        data: {
          publicId,
          event: parsed.event,
          organizationId: parsed.organizationId ?? null,
          actorUserId: parsed.actorUserId ?? null,
          templateKey,
          variables: parsed.variables as Prisma.InputJsonValue,
          recipientSnapshot: recipients as unknown as Prisma.InputJsonValue,
          policySnapshot: primaryPolicy as unknown as Prisma.InputJsonValue,
          status: "jobs_created",
          idempotencyKey: parsed.idempotencyKey,
          metadata: (parsed.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });

      const jobs = [];
      for (const plan of jobPlans) {
        const address = addressForChannel(plan.recipient)[plan.channel]!;
        const adapterKey = DEFAULT_ADAPTER_BY_CHANNEL[plan.channel];
        const idempotencyKey = `${parsed.idempotencyKey}:${plan.channel}:${plan.recipient.userId ?? address}`;
        const maxAttempts =
          plan.policySnapshot.retry?.maxAttempts ??
          DEFAULT_POLICY.retry!.maxAttempts;

        const job = await tx.notificationJob.create({
          data: {
            intentId: intent.id,
            channel: plan.channel,
            providerKey: adapterKey,
            recipientUserId: plan.recipient.userId,
            recipientAddress: address,
            recipientRole: plan.recipient.role,
            priority,
            status: "scheduled",
            attempts: 0,
            maxAttempts,
            scheduledAt: plan.schedule.scheduledAt,
            renderedSubject: plan.rendered.subject,
            renderedBodyText: plan.rendered.bodyText,
            renderedBodyHtml: plan.rendered.bodyHtml,
            idempotencyKey,
            metadata: {
              digestDeferred: plan.schedule.digestDeferred,
              deferredForQuietHours: plan.schedule.deferredForQuietHours,
              deferredForDnd: plan.schedule.deferredForDnd,
            } as Prisma.InputJsonValue,
          },
        });
        jobs.push(job);
      }

      return { intent, jobs };
    });

    if (parsed.dispatchNow) {
      for (const job of result.jobs) {
        if (job.scheduledAt.getTime() <= Date.now()) {
          await dispatchNotificationJob({
            input: { jobId: job.id, preferLive: true },
          });
        }
      }
      const refreshed = await prisma.notificationIntent.findUniqueOrThrow({
        where: { id: result.intent.id },
        include: { jobs: { select: { id: true, channel: true, status: true } } },
      });
      return apiSuccess({
        ...mapIntent(refreshed, refreshed.jobs.length),
        jobs: refreshed.jobs,
      });
    }

    return apiSuccess({
      ...mapIntent(result.intent, result.jobs.length),
      jobs: result.jobs.map((j) => ({
        id: j.id,
        channel: j.channel,
        status: j.status,
      })),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return error.toApiError();
    }
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "NOTIFICATION_INTENT_FAILED",
      error instanceof Error ? error.message : "Could not create notification intent",
    );
  }
}

/**
 * Emit a hub intent from a normalized domain event name.
 */
export async function emitNotificationFromDomainEvent(params: {
  event: NotificationHubEvent;
  organizationId?: string | null;
  actorUserId?: string | null;
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
  return createNotificationIntent({
    input: {
      event: params.event,
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      recipients: params.recipients,
      variables: params.variables,
      idempotencyKey: params.idempotencyKey,
      channels: params.channels,
      policyKey: params.policyKey,
      dispatchNow: params.dispatchNow,
    },
  });
}

export async function dispatchNotificationJob(params: {
  input: unknown;
}): Promise<ApiResponse<NotificationJobRecord>> {
  try {
    const parsed = dispatchJobSchema.parse(params.input);
    const job = await prisma.notificationJob.findUnique({
      where: { id: parsed.jobId },
      include: { intent: true },
    });
    if (!job) {
      throw new AppError("JOB_NOT_FOUND", "Notification job not found", 404);
    }

    if (job.status === "delivered") {
      return apiSuccess({
        id: job.id,
        intentPublicId: job.intent.publicId,
        channel: job.channel as NotificationChannel,
        status: job.status as NotificationJobStatus,
        attempts: job.attempts,
        scheduledAt: job.scheduledAt.toISOString(),
        deliveredAt: job.deliveredAt?.toISOString() ?? null,
        providerKey: job.providerKey,
        providerRef: job.providerRef,
      });
    }

    if (job.scheduledAt.getTime() > Date.now()) {
      throw new AppError(
        "JOB_NOT_DUE",
        "Notification job is not scheduled yet",
        409,
      );
    }

    const channel = job.channel as NotificationChannel;
    const preferLive = parsed.preferLive ?? true;
    // When preferLive: pick Resend (if keyed) / memory. Else honor job.providerKey.
    const adapter = selectNotificationAdapter({
      providerKey: preferLive
        ? undefined
        : job.providerKey ?? undefined,
      channel,
      preferLive,
    });

    await prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: "delivering",
        attempts: { increment: 1 },
        providerKey: adapter.providerKey,
      },
    });

    const result = await adapter.deliver({
      channel,
      to: job.recipientAddress,
      subject: job.renderedSubject ?? undefined,
      bodyText: job.renderedBodyText,
      bodyHtml: job.renderedBodyHtml ?? undefined,
      title: job.renderedSubject ?? undefined,
      idempotencyKey: job.idempotencyKey,
      templateKey: job.intent.templateKey,
    });

    if (result.status === "delivered" || result.status === "queued") {
      const updated = await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: result.status === "delivered" ? "delivered" : "queued",
          deliveredAt:
            result.status === "delivered"
              ? new Date(result.deliveredAt ?? Date.now())
              : null,
          providerRef: result.providerRef,
          failureDetails:
            result.status === "queued"
              ? ({ stubQueued: true, raw: result.raw } as Prisma.InputJsonValue)
              : undefined,
        },
        include: { intent: true },
      });
      await refreshIntentStatus(job.intentId);
      metrics.notification({
        channel,
        outcome: result.status === "delivered" ? "delivered" : "queued",
      });
      return apiSuccess({
        id: updated.id,
        intentPublicId: updated.intent.publicId,
        channel: updated.channel as NotificationChannel,
        status: updated.status as NotificationJobStatus,
        attempts: updated.attempts,
        scheduledAt: updated.scheduledAt.toISOString(),
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
        providerKey: updated.providerKey,
        providerRef: updated.providerRef,
      });
    }

    const attempts = job.attempts + 1;
    const retry = computeRetrySchedule({
      attempts,
      retry: {
        maxAttempts: job.maxAttempts,
        backoffSeconds: 60,
      },
    });

    const updated = await prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: retry.exhausted ? "dead_lettered" : "scheduled",
        scheduledAt: retry.exhausted ? job.scheduledAt : retry.nextAt,
        failureDetails: {
          reason: result.failureReason ?? "delivery_failed",
          raw: result.raw ?? null,
          deadLetter: retry.exhausted,
          attempts,
        } as Prisma.InputJsonValue,
        providerRef: result.providerRef,
      },
      include: { intent: true },
    });
    await refreshIntentStatus(job.intentId);
    metrics.notification({ channel, outcome: "failed" });

    if (retry.exhausted) {
      await maybeEnqueueChannelFallback({
        failedJob: updated,
        event: job.intent.event as NotificationHubEvent,
      });
    }

    return apiSuccess({
      id: updated.id,
      intentPublicId: updated.intent.publicId,
      channel: updated.channel as NotificationChannel,
      status: updated.status as NotificationJobStatus,
      attempts: updated.attempts,
      scheduledAt: updated.scheduledAt.toISOString(),
      deliveredAt: updated.deliveredAt?.toISOString() ?? null,
      providerKey: updated.providerKey,
      providerRef: updated.providerRef,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return error.toApiError();
    }
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "NOTIFICATION_DISPATCH_FAILED",
      error instanceof Error ? error.message : "Could not dispatch notification job",
    );
  }
}

async function refreshIntentStatus(intentId: string): Promise<void> {
  const jobs = await prisma.notificationJob.findMany({
    where: { intentId },
    select: { status: true },
  });
  if (jobs.length === 0) return;

  const statuses = jobs.map((j) => j.status);
  const allDelivered = statuses.every((s) => s === "delivered" || s === "skipped");
  const anyDelivered = statuses.some((s) => s === "delivered");
  const allFailed = statuses.every(
    (s) => s === "failed" || s === "dead_lettered" || s === "cancelled",
  );

  let status: NotificationIntentStatus = "jobs_created";
  if (allDelivered) status = "delivered";
  else if (allFailed) status = "failed";
  else if (anyDelivered) status = "partially_delivered";

  await prisma.notificationIntent.update({
    where: { id: intentId },
    data: { status },
  });
}

/**
 * Optional fallback: SMS/WhatsApp dead-letter → email (or SMS) job on same intent.
 */
async function maybeEnqueueChannelFallback(params: {
  failedJob: {
    id: string;
    intentId: string;
    channel: string;
    recipientUserId: string | null;
    recipientAddress: string;
    recipientRole: string | null;
    priority: string;
    maxAttempts: number;
    renderedSubject: string | null;
    renderedBodyText: string;
    renderedBodyHtml: string | null;
    idempotencyKey: string;
    intent: {
      event: string;
      templateKey: string;
      variables: unknown;
      publicId: string;
    };
  };
  event: NotificationHubEvent;
}): Promise<void> {
  const failedChannel = params.failedJob.channel as NotificationChannel;
  const enable =
    process.env.ZOLANZO_SMS_EMAIL_FALLBACK !== "0" &&
    (failedChannel === "sms" || failedChannel === "whatsapp") &&
    shouldAttemptSmsEmailFallback(params.event);

  const targets = resolveFallbackChannels({
    failedChannel,
    enabled: enable,
  });
  if (targets.length === 0) return;

  const variables =
    params.failedJob.intent.variables &&
    typeof params.failedJob.intent.variables === "object"
      ? (params.failedJob.intent.variables as Record<string, string>)
      : {};

  for (const target of targets) {
    const template = findBuiltinTemplate({
      event: params.event,
      channel: target,
    });
    if (!template) continue;

    // Need an address for the fallback channel — email from variables if present.
    const to =
      target === "email"
        ? variables.recipientEmail || variables.email || null
        : target === "sms" || target === "whatsapp"
          ? params.failedJob.recipientAddress
          : null;
    if (!to) continue;

    const rendered = renderNotificationTemplate({
      template,
      variables: {
        recipientName: variables.recipientName ?? "there",
        organizationName: variables.organizationName ?? "ZOLANZO",
        publicRef: variables.publicRef ?? params.failedJob.intent.publicId,
        ...variables,
      },
    });

    const fallbackKey = `${params.failedJob.idempotencyKey}:fallback:${target}`;
    try {
      await prisma.notificationJob.create({
        data: {
          intentId: params.failedJob.intentId,
          channel: target,
          providerKey: DEFAULT_ADAPTER_BY_CHANNEL[target],
          recipientUserId: params.failedJob.recipientUserId,
          recipientAddress: to,
          recipientRole: params.failedJob.recipientRole,
          priority: params.failedJob.priority,
          status: "scheduled",
          attempts: 0,
          maxAttempts: params.failedJob.maxAttempts,
          scheduledAt: new Date(),
          renderedSubject: rendered.subject,
          renderedBodyText: rendered.bodyText,
          renderedBodyHtml: rendered.bodyHtml,
          idempotencyKey: fallbackKey,
          metadata: {
            fallbackFrom: failedChannel,
            fallbackOfJobId: params.failedJob.id,
          } as Prisma.InputJsonValue,
        },
      });
    } catch {
      // Unique idempotency — already enqueued
    }
  }
}

export async function upsertNotificationPreference(params: {
  input: unknown;
}): Promise<ApiResponse<{ subjectKey: string; scope: string }>> {
  try {
    const parsed = upsertPreferenceSchema.parse(params.input);
    if (parsed.scope === "user" && !parsed.userId) {
      throw new AppError("USER_REQUIRED", "user scope requires userId", 400);
    }
    if (parsed.scope === "organization" && !parsed.organizationId) {
      throw new AppError(
        "ORG_REQUIRED",
        "organization scope requires organizationId",
        400,
      );
    }

    const subjectKey =
      parsed.scope === "user"
        ? preferenceSubjectKey("user", parsed.userId!)
        : preferenceSubjectKey("organization", parsed.organizationId!);

    await prisma.notificationPreference.upsert({
      where: { subjectKey },
      create: {
        scope: parsed.scope,
        subjectKey,
        userId: parsed.userId ?? null,
        organizationId: parsed.organizationId ?? null,
        enabledChannels: parsed.enabledChannels as Prisma.InputJsonValue,
        quietHoursStart: parsed.quietHoursStart ?? null,
        quietHoursEnd: parsed.quietHoursEnd ?? null,
        timezone: parsed.timezone,
        locale: parsed.locale,
        eventSubscriptions: (parsed.eventSubscriptions ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        digestFrequency: parsed.digestFrequency,
        dndWindows: (parsed.dndWindows ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
      update: {
        enabledChannels: parsed.enabledChannels as Prisma.InputJsonValue,
        quietHoursStart: parsed.quietHoursStart ?? null,
        quietHoursEnd: parsed.quietHoursEnd ?? null,
        timezone: parsed.timezone,
        locale: parsed.locale,
        eventSubscriptions: (parsed.eventSubscriptions ?? null) as
          | Prisma.InputJsonValue
          | undefined,
        digestFrequency: parsed.digestFrequency,
        dndWindows: (parsed.dndWindows ?? null) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });

    return apiSuccess({ subjectKey, scope: parsed.scope });
  } catch (error) {
    if (error instanceof AppError) {
      return error.toApiError();
    }
    if (error instanceof z.ZodError) {
      return apiError("VALIDATION_ERROR", error.message);
    }
    return apiError(
      "NOTIFICATION_PREFERENCE_FAILED",
      error instanceof Error
        ? error.message
        : "Could not upsert notification preference",
    );
  }
}

export type { RecipientHint, RecipientRole };
