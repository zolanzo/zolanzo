/**
 * ActionRegistry — actions invoke existing domain services only.
 * No direct DB mutation.
 */

import {
  isAutomationActionsEnabled,
  AUTOMATION_ACTION_TIMEOUT_MS,
} from "@/lib/automation/config";
import type {
  ActionExecutionResult,
  AutomationActionSpec,
  AutomationActionType,
  AutomationEvent,
  AutomationRule,
} from "@/lib/automation/types";

export type ActionHandler = (params: {
  action: AutomationActionSpec;
  event: AutomationEvent;
  rule: AutomationRule;
  dryRun: boolean;
}) => Promise<ActionExecutionResult>;

const handlers = new Map<AutomationActionType, ActionHandler>();

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Action timeout: ${label}`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function okResult(
  type: AutomationActionType,
  dryRun: boolean,
  message: string,
  durationMs: number,
  detail?: Record<string, unknown>,
): ActionExecutionResult {
  return { actionType: type, ok: true, dryRun, message, durationMs, detail };
}

function failResult(
  type: AutomationActionType,
  dryRun: boolean,
  message: string,
  durationMs: number,
): ActionExecutionResult {
  return { actionType: type, ok: false, dryRun, message, durationMs };
}

const builtinHandlers: Record<AutomationActionType, ActionHandler> = {
  send_notification: async ({ action, event, dryRun }) => {
    const started = Date.now();
    if (dryRun) {
      return okResult(
        "send_notification",
        true,
        "Dry-run: would send notification",
        Date.now() - started,
        { event: action.params?.event ?? "automation.notify" },
      );
    }
    try {
      const { safeEmitDomainNotification } = await import(
        "@/features/notifications/services/safe-emit"
      );
      const userId =
        (event.userId as string | undefined) ??
        (event.payload.userId as string | undefined) ??
        null;
      const hubEvent = (action.params?.event as string | undefined) ??
        "security.alert";
      await withTimeout(
        safeEmitDomainNotification({
          event: hubEvent as import("@/constants/notification").NotificationHubEvent,
          organizationId: event.organizationId ?? null,
          actorUserId: userId,
          recipients: userId
            ? [
                {
                  role: "worker",
                  userId,
                  email: (event.payload.email as string | null) ?? null,
                  phone: (event.payload.phone as string | null) ?? null,
                  displayName:
                    (event.payload.displayName as string | null) ?? null,
                },
              ]
            : [],
          variables: {
            recipientName: "there",
            publicRef: String(event.payload.publicRef ?? event.id),
            ...(action.params?.variables as Record<string, string> | undefined),
          },
          idempotencyKey: `automation.notify:${event.idempotencyKey}`,
          channels: ["in_app"],
          span: "automation.action.notify",
        }),
        AUTOMATION_ACTION_TIMEOUT_MS,
        "send_notification",
      );
      return okResult(
        "send_notification",
        false,
        "Notification emit requested",
        Date.now() - started,
      );
    } catch (error) {
      return failResult(
        "send_notification",
        false,
        error instanceof Error ? error.message : String(error),
        Date.now() - started,
      );
    }
  },

  generate_report: async ({ action, event, dryRun }) => {
    const started = Date.now();
    const reportType = String(action.params?.reportType ?? "operations");
    if (dryRun) {
      return okResult(
        "generate_report",
        true,
        `Dry-run: would generate ${reportType} report`,
        Date.now() - started,
      );
    }
    try {
      const { generateReport } = await import("@/lib/analytics/reports");
      const result = await withTimeout(
        generateReport({
          type: reportType as
            | "executive"
            | "campaign"
            | "finance"
            | "trust"
            | "ai"
            | "operations",
          organizationId: event.organizationId,
          campaignId: event.campaignId,
          format: (action.params?.format as "json") ?? "json",
        }),
        AUTOMATION_ACTION_TIMEOUT_MS,
        "generate_report",
      );
      return okResult(
        "generate_report",
        false,
        result ? `Report ${result.report.publicId}` : "Report skipped",
        Date.now() - started,
        { reportId: result?.report.id },
      );
    } catch (error) {
      return failResult(
        "generate_report",
        false,
        error instanceof Error ? error.message : String(error),
        Date.now() - started,
      );
    }
  },

  schedule_report: async ({ action, event, dryRun }) => {
    const started = Date.now();
    if (dryRun) {
      return okResult(
        "schedule_report",
        true,
        "Dry-run: would schedule report",
        Date.now() - started,
      );
    }
    try {
      const { scheduleReport } = await import("@/lib/analytics/reports");
      const schedule = scheduleReport({
        type: (action.params?.reportType as "operations") ?? "operations",
        frequency: (action.params?.frequency as "weekly") ?? "weekly",
        format: (action.params?.format as "json") ?? "json",
        organizationId: event.organizationId,
        campaignId: event.campaignId,
      });
      return okResult(
        "schedule_report",
        false,
        schedule ? `Scheduled ${schedule.publicId}` : "Schedule skipped",
        Date.now() - started,
        { scheduleId: schedule?.id },
      );
    } catch (error) {
      return failResult(
        "schedule_report",
        false,
        error instanceof Error ? error.message : String(error),
        Date.now() - started,
      );
    }
  },

  refresh_analytics_snapshot: async ({ dryRun }) => {
    const started = Date.now();
    if (dryRun) {
      return okResult(
        "refresh_analytics_snapshot",
        true,
        "Dry-run: would refresh analytics snapshot",
        Date.now() - started,
      );
    }
    try {
      const { rollup, snapshot } = await import("@/lib/analytics");
      await withTimeout(
        (async () => {
          await rollup({ period: "daily" });
          await snapshot({ period: "daily" });
        })(),
        AUTOMATION_ACTION_TIMEOUT_MS,
        "refresh_analytics_snapshot",
      );
      return okResult(
        "refresh_analytics_snapshot",
        false,
        "Analytics rollup + snapshot requested",
        Date.now() - started,
      );
    } catch (error) {
      return failResult(
        "refresh_analytics_snapshot",
        false,
        error instanceof Error ? error.message : String(error),
        Date.now() - started,
      );
    }
  },

  request_forecast_refresh: async ({ action, event, dryRun }) => {
    const started = Date.now();
    const forecastType = String(action.params?.forecastType ?? "campaign");
    if (dryRun) {
      return okResult(
        "request_forecast_refresh",
        true,
        `Dry-run: would refresh ${forecastType} forecast`,
        Date.now() - started,
      );
    }
    try {
      const { refreshForecast } = await import("@/lib/analytics/forecast");
      const result = await withTimeout(
        refreshForecast({
          type: forecastType as
            | "campaign"
            | "workforce"
            | "finance"
            | "trust"
            | "reviews"
            | "ai_operations",
          organizationId: event.organizationId,
          campaignId: event.campaignId,
        }),
        AUTOMATION_ACTION_TIMEOUT_MS,
        "request_forecast_refresh",
      );
      return okResult(
        "request_forecast_refresh",
        false,
        result ? `Forecast ${result.type}` : "Forecast skipped",
        Date.now() - started,
        { confidence: result?.confidence },
      );
    } catch (error) {
      return failResult(
        "request_forecast_refresh",
        false,
        error instanceof Error ? error.message : String(error),
        Date.now() - started,
      );
    }
  },

  recalculate_trust: async ({ event, dryRun }) => {
    const started = Date.now();
    const subjectId =
      event.userId ??
      (event.payload.userId as string | undefined) ??
      (event.payload.subjectId as string | undefined);
    if (dryRun) {
      return okResult(
        "recalculate_trust",
        true,
        `Dry-run: would recalculate trust for ${subjectId ?? "unknown"}`,
        Date.now() - started,
      );
    }
    if (!subjectId) {
      return failResult(
        "recalculate_trust",
        false,
        "Missing subjectId/userId",
        Date.now() - started,
      );
    }
    try {
      const { recalculate } = await import("@/lib/trust/trust-profile-service");
      await withTimeout(
        recalculate({
          subjectType: "worker",
          subjectId,
        }),
        AUTOMATION_ACTION_TIMEOUT_MS,
        "recalculate_trust",
      );
      return okResult(
        "recalculate_trust",
        false,
        `Trust recalculated for ${subjectId}`,
        Date.now() - started,
      );
    } catch (error) {
      return failResult(
        "recalculate_trust",
        false,
        error instanceof Error ? error.message : String(error),
        Date.now() - started,
      );
    }
  },

  create_review_task: async ({ event, dryRun, action }) => {
    const started = Date.now();
    // Foundation: enqueue as operational escalation signal — no domain DB write.
    if (dryRun) {
      return okResult(
        "create_review_task",
        true,
        "Dry-run: would create review task",
        Date.now() - started,
      );
    }
    return okResult(
      "create_review_task",
      false,
      "Review task requested via automation (queued signal)",
      Date.now() - started,
      {
        submissionId: event.payload.submissionId,
        queue: action.params?.queue ?? "review",
        advisoryOnly: true,
      },
    );
  },

  escalate_operations: async ({ event, dryRun, action }) => {
    const started = Date.now();
    if (dryRun) {
      return okResult(
        "escalate_operations",
        true,
        "Dry-run: would escalate to operations",
        Date.now() - started,
      );
    }
    // Foundation: record escalation intent without OPC DB writes unless wired later.
    return okResult(
      "escalate_operations",
      false,
      "Operations escalation signaled",
      Date.now() - started,
      {
        reason: action.params?.reason ?? "automation_rule",
        correlationId: event.correlationId,
        queue: action.params?.queue ?? "operations",
        advisoryOnly: true,
      },
    );
  },
};

for (const [type, handler] of Object.entries(builtinHandlers) as Array<
  [AutomationActionType, ActionHandler]
>) {
  handlers.set(type, handler);
}

export function registerAction(
  type: AutomationActionType,
  handler: ActionHandler,
): void {
  handlers.set(type, handler);
}

export function listActions(): AutomationActionType[] {
  return [...handlers.keys()];
}

export async function executeAction(params: {
  action: AutomationActionSpec;
  event: AutomationEvent;
  rule: AutomationRule;
  dryRun: boolean;
}): Promise<ActionExecutionResult> {
  if (!isAutomationActionsEnabled() && !params.dryRun) {
    return failResult(
      params.action.type,
      false,
      "AUTOMATION_ACTIONS disabled",
      0,
    );
  }
  const handler = handlers.get(params.action.type);
  if (!handler) {
    return failResult(
      params.action.type,
      params.dryRun,
      `Unknown action: ${params.action.type}`,
      0,
    );
  }
  return handler(params);
}

export const ActionRegistry = {
  register: registerAction,
  list: listActions,
  execute: executeAction,
};
