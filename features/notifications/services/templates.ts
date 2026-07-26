/**
 * Built-in notification templates — strongly typed variables, no inline messages.
 */

import type { NotificationChannel } from "@/constants/notification";
import type { NotificationHubEvent } from "@/constants/notification";

export type NotificationTemplateDefinition = {
  key: string;
  event: NotificationHubEvent;
  channel: NotificationChannel;
  locale: string;
  subject?: string;
  bodyText: string;
  bodyHtml?: string;
  requiredVariables: readonly string[];
};

const COMMON_VARS = ["recipientName", "organizationName", "publicRef"] as const;

function emailTemplate(
  event: NotificationHubEvent,
  subject: string,
  bodyText: string,
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "email",
    locale: "en",
    subject,
    bodyText,
    bodyHtml: `<p>${bodyText.replace(/\n/g, "<br/>")}</p>`,
    requiredVariables: [...COMMON_VARS, ...extraVars],
  };
}

function smsTemplate(
  event: NotificationHubEvent,
  bodyText: string,
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "sms",
    locale: "en",
    bodyText,
    requiredVariables: [...COMMON_VARS, ...extraVars],
  };
}

function pushTemplate(
  event: NotificationHubEvent,
  title: string,
  bodyText: string,
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "push",
    locale: "en",
    subject: title,
    bodyText,
    requiredVariables: [...COMMON_VARS, ...extraVars],
  };
}

function inAppTemplate(
  event: NotificationHubEvent,
  title: string,
  bodyText: string,
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "in_app",
    locale: "en",
    subject: title,
    bodyText,
    requiredVariables: [...COMMON_VARS, ...extraVars],
  };
}

function webhookTemplate(
  event: NotificationHubEvent,
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "webhook",
    locale: "en",
    bodyText:
      '{"event":"{{event}}","publicRef":"{{publicRef}}","recipientName":"{{recipientName}}"}',
    requiredVariables: [...COMMON_VARS, "event", ...extraVars],
  };
}

export const BUILTIN_NOTIFICATION_TEMPLATES: readonly NotificationTemplateDefinition[] =
  [
    emailTemplate(
      "review.approved",
      "Review approved — {{publicRef}}",
      "Hi {{recipientName}}, your submission was approved for {{organizationName}}. Ref: {{publicRef}}.",
      ["decisionSummary"],
    ),
    smsTemplate(
      "review.approved",
      "ZOLANZO: Review approved ({{publicRef}}).",
    ),
    pushTemplate(
      "review.approved",
      "Review approved",
      "Your submission {{publicRef}} was approved.",
    ),
    inAppTemplate(
      "review.approved",
      "Review approved",
      "Submission {{publicRef}} was approved.",
    ),
    webhookTemplate("review.approved", ["decisionSummary"]),

    emailTemplate(
      "review.rejected",
      "Review rejected — {{publicRef}}",
      "Hi {{recipientName}}, your submission was rejected for {{organizationName}}. Ref: {{publicRef}}. {{decisionSummary}}",
      ["decisionSummary"],
    ),
    smsTemplate(
      "review.rejected",
      "ZOLANZO: Review rejected ({{publicRef}}).",
    ),
    pushTemplate(
      "review.rejected",
      "Review rejected",
      "Your submission {{publicRef}} was rejected.",
    ),
    inAppTemplate(
      "review.rejected",
      "Review rejected",
      "Submission {{publicRef}} was rejected.",
    ),
    webhookTemplate("review.rejected"),

    emailTemplate(
      "review.revision_requested",
      "Revision requested — {{publicRef}}",
      "Hi {{recipientName}}, a revision was requested for {{publicRef}} at {{organizationName}}. {{decisionSummary}}",
      ["decisionSummary"],
    ),
    smsTemplate(
      "review.revision_requested",
      "ZOLANZO: Revision requested ({{publicRef}}).",
    ),
    pushTemplate(
      "review.revision_requested",
      "Revision requested",
      "Please revise submission {{publicRef}}.",
    ),
    inAppTemplate(
      "review.revision_requested",
      "Revision requested",
      "Revision requested for {{publicRef}}.",
    ),
    webhookTemplate("review.revision_requested"),

    emailTemplate(
      "settlement.completed",
      "Settlement completed — {{publicRef}}",
      "Hi {{recipientName}}, settlement {{publicRef}} completed for {{organizationName}}. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "settlement.completed",
      "ZOLANZO: Settlement {{publicRef}} completed ({{amountLabel}}).",
      ["amountLabel"],
    ),
    pushTemplate(
      "settlement.completed",
      "Settlement completed",
      "Settlement {{publicRef}} completed.",
    ),
    inAppTemplate(
      "settlement.completed",
      "Settlement completed",
      "Settlement {{publicRef}} completed.",
    ),
    webhookTemplate("settlement.completed", ["amountLabel"]),

    emailTemplate(
      "withdrawal.approved",
      "Withdrawal approved — {{publicRef}}",
      "Hi {{recipientName}}, withdrawal {{publicRef}} was approved. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "withdrawal.approved",
      "ZOLANZO: Withdrawal {{publicRef}} approved.",
    ),
    pushTemplate(
      "withdrawal.approved",
      "Withdrawal approved",
      "Withdrawal {{publicRef}} approved.",
    ),
    inAppTemplate(
      "withdrawal.approved",
      "Withdrawal approved",
      "Withdrawal {{publicRef}} approved.",
    ),
    webhookTemplate("withdrawal.approved", ["amountLabel"]),

    emailTemplate(
      "withdrawal.completed",
      "Withdrawal completed — {{publicRef}}",
      "Hi {{recipientName}}, withdrawal {{publicRef}} completed. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "withdrawal.completed",
      "ZOLANZO: Withdrawal {{publicRef}} completed.",
    ),
    pushTemplate(
      "withdrawal.completed",
      "Withdrawal completed",
      "Withdrawal {{publicRef}} completed.",
    ),
    inAppTemplate(
      "withdrawal.completed",
      "Withdrawal completed",
      "Withdrawal {{publicRef}} completed.",
    ),
    webhookTemplate("withdrawal.completed", ["amountLabel"]),

    emailTemplate(
      "campaign.funded",
      "Campaign funded — {{publicRef}}",
      "Hi {{recipientName}}, campaign {{publicRef}} was funded for {{organizationName}}. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "campaign.funded",
      "ZOLANZO: Campaign {{publicRef}} funded.",
    ),
    pushTemplate(
      "campaign.funded",
      "Campaign funded",
      "Campaign {{publicRef}} funded.",
    ),
    inAppTemplate(
      "campaign.funded",
      "Campaign funded",
      "Campaign {{publicRef}} funded.",
    ),
    webhookTemplate("campaign.funded", ["amountLabel"]),

    emailTemplate(
      "assignment.claimed",
      "Assignment claimed — {{publicRef}}",
      "Hi {{recipientName}}, assignment {{publicRef}} was claimed at {{organizationName}}.",
    ),
    smsTemplate(
      "assignment.claimed",
      "ZOLANZO: Assignment {{publicRef}} claimed.",
    ),
    pushTemplate(
      "assignment.claimed",
      "Assignment claimed",
      "Assignment {{publicRef}} claimed.",
    ),
    inAppTemplate(
      "assignment.claimed",
      "Assignment claimed",
      "Assignment {{publicRef}} claimed.",
    ),
    webhookTemplate("assignment.claimed"),

    emailTemplate(
      "submission.received",
      "Submission received — {{publicRef}}",
      "Hi {{recipientName}}, submission {{publicRef}} was received for {{organizationName}}.",
    ),
    smsTemplate(
      "submission.received",
      "ZOLANZO: Submission {{publicRef}} received.",
    ),
    pushTemplate(
      "submission.received",
      "Submission received",
      "Submission {{publicRef}} received.",
    ),
    inAppTemplate(
      "submission.received",
      "Submission received",
      "Submission {{publicRef}} received.",
    ),
    webhookTemplate("submission.received"),
  ];

export type RenderedNotification = {
  subject: string | null;
  bodyText: string;
  bodyHtml: string | null;
};

const VAR_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplateString(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(VAR_PATTERN, (_match, key: string) => {
    return variables[key] ?? "";
  });
}

export function findBuiltinTemplate(params: {
  event: NotificationHubEvent;
  channel: NotificationChannel;
  locale?: string;
}): NotificationTemplateDefinition | null {
  const locale = params.locale ?? "en";
  return (
    BUILTIN_NOTIFICATION_TEMPLATES.find(
      (t) =>
        t.event === params.event &&
        t.channel === params.channel &&
        t.locale === locale,
    ) ?? null
  );
}

export function renderNotificationTemplate(params: {
  template: NotificationTemplateDefinition;
  variables: Record<string, string>;
}): RenderedNotification {
  const missing = params.template.requiredVariables.filter(
    (v) => !(v in params.variables) || params.variables[v] === "",
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing template variables for ${params.template.key}/${params.template.channel}: ${missing.join(", ")}`,
    );
  }

  const vars = {
    ...params.variables,
    event: params.template.event,
  };

  return {
    subject: params.template.subject
      ? renderTemplateString(params.template.subject, vars)
      : null,
    bodyText: renderTemplateString(params.template.bodyText, vars),
    bodyHtml: params.template.bodyHtml
      ? renderTemplateString(params.template.bodyHtml, vars)
      : null,
  };
}

export function templateKeyForEvent(event: NotificationHubEvent): string {
  return event.replace(/\./g, "_");
}
