/**
 * Built-in notification templates — strongly typed variables, no inline messages.
 */

import type { NotificationChannel } from "@/constants/notification";
import type { NotificationHubEvent } from "@/constants/notification";
import { APP_CONFIG } from "@/config/app";
import {
  formatTransactionalPlainText,
  getBrandedAuthMessageTemplate,
} from "@/lib/email/templates";

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
  const paragraphs = bodyText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;">${line}</p>`)
    .join("");
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "email",
    locale: "en",
    subject,
    bodyText,
    bodyHtml: `<!DOCTYPE html><html lang="en"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">${paragraphs}</body></html>`,
    requiredVariables: [...COMMON_VARS, ...extraVars],
  };
}

/** Auth / security emails use the ZOLANZO light-mode shell. Campaign mail stays generic. */
function brandedAuthEmailTemplate(
  event: NotificationHubEvent,
  subject: string,
  bodyText: string,
  visual: {
    kicker: string;
    heading: string;
    body: string;
    actionLabel?: string;
    actionUrl?: string;
    code?: string;
    note?: string;
  },
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "email",
    locale: "en",
    subject,
    bodyText: formatTransactionalPlainText({
      heading: visual.heading,
      body: bodyText,
      code: visual.code,
      note: visual.note,
    }),
    bodyHtml: getBrandedAuthMessageTemplate({
      title: subject,
      kicker: visual.kicker,
      heading: visual.heading,
      recipientName: "{{recipientName}}",
      body: visual.body,
      actionLabel: visual.actionLabel,
      actionUrl: visual.actionUrl,
      code: visual.code,
      note: visual.note,
    }),
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

function whatsappTemplate(
  event: NotificationHubEvent,
  bodyText: string,
  extraVars: readonly string[] = [],
): NotificationTemplateDefinition {
  return {
    key: event.replace(/\./g, "_"),
    event,
    channel: "whatsapp",
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

    // ── Auth ──────────────────────────────────────────
    brandedAuthEmailTemplate(
      "auth.welcome",
      "Welcome to ZOLANZO",
      "Hi {{recipientName}}, welcome to {{organizationName}}. Your account is ready.",
      {
        kicker: "Welcome",
        heading: "Your account is ready",
        body: "Welcome to {{organizationName}}. Your account is ready to use.",
        note: "If you did not create this account, contact support.",
      },
    ),
    inAppTemplate(
      "auth.welcome",
      "Welcome",
      "Welcome to {{organizationName}}.",
    ),

    brandedAuthEmailTemplate(
      "auth.email_verification",
      "Verify your email",
      "Hi {{recipientName}}, verify your email for {{organizationName}} using this link: {{actionUrl}}",
      {
        kicker: "Email Verification",
        heading: "Confirm your email address",
        body: "Verify your email for {{organizationName}} by opening the link below.",
        actionLabel: "Verify email",
        actionUrl: "{{actionUrl}}",
        note: "If you did not create this account, ignore this email.",
      },
      ["actionUrl"],
    ),
    inAppTemplate(
      "auth.email_verification",
      "Verify email",
      "Please verify your email.",
      ["actionUrl"],
    ),

    brandedAuthEmailTemplate(
      "auth.password_reset",
      "Reset your password",
      "Hi {{recipientName}}, reset your {{organizationName}} password: {{actionUrl}}",
      {
        kicker: "Account Recovery",
        heading: "Reset your password",
        body: "A password reset was requested for your {{organizationName}} account.",
        actionLabel: "Reset password",
        actionUrl: "{{actionUrl}}",
        note: "If you did not request a password reset, ignore this email.",
      },
      ["actionUrl"],
    ),
    inAppTemplate(
      "auth.password_reset",
      "Password reset",
      "Password reset requested.",
      ["actionUrl"],
    ),

    brandedAuthEmailTemplate(
      "auth.magic_link",
      "Your sign-in link",
      "Hi {{recipientName}}, use this magic link to sign in to {{organizationName}}: {{actionUrl}}",
      {
        kicker: "Sign-in",
        heading: "Your sign-in link",
        body: "Use this link to sign in to {{organizationName}}. It is single-use and expires soon.",
        actionLabel: "Sign in",
        actionUrl: "{{actionUrl}}",
        note: "If you did not request this sign-in link, ignore this email.",
      },
      ["actionUrl"],
    ),
    inAppTemplate(
      "auth.magic_link",
      "Magic link",
      "Your sign-in link is ready.",
      ["actionUrl"],
    ),

    // ── Organizations ─────────────────────────────────
    brandedAuthEmailTemplate(
      "org.invite_member",
      "You're invited to {{organizationName}}",
      "Hi {{recipientName}}, you've been invited to join {{organizationName}}. Accept: {{actionUrl}}",
      {
        kicker: "Invitation",
        heading: "You're invited to {{organizationName}}",
        body: "You've been invited to join {{organizationName}}.",
        actionLabel: "Accept invitation",
        actionUrl: "{{actionUrl}}",
        note: "Open this link while signed in with the invited email. If you were not expecting this invitation, you can ignore this email.",
      },
      ["actionUrl"],
    ),
    inAppTemplate(
      "org.invite_member",
      "Organization invite",
      "Invite to {{organizationName}}.",
      ["actionUrl"],
    ),

    emailTemplate(
      "org.invite_accepted",
      "Invite accepted — {{organizationName}}",
      "Hi {{recipientName}}, {{inviteeName}} accepted the invite to {{organizationName}}.",
      ["inviteeName"],
    ),
    inAppTemplate(
      "org.invite_accepted",
      "Invite accepted",
      "{{inviteeName}} joined {{organizationName}}.",
      ["inviteeName"],
    ),

    emailTemplate(
      "org.invite_revoked",
      "Invite revoked — {{organizationName}}",
      "Hi {{recipientName}}, your invite to {{organizationName}} was revoked.",
    ),
    inAppTemplate(
      "org.invite_revoked",
      "Invite revoked",
      "Invite to {{organizationName}} was revoked.",
    ),

    // ── Campaigns / assignments ───────────────────────
    emailTemplate(
      "campaign.published",
      "Campaign published — {{publicRef}}",
      "Hi {{recipientName}}, campaign {{publicRef}} is published for {{organizationName}}.",
    ),
    inAppTemplate(
      "campaign.published",
      "Campaign published",
      "Campaign {{publicRef}} published.",
    ),

    emailTemplate(
      "assignment.received",
      "New assignment — {{publicRef}}",
      "Hi {{recipientName}}, you received assignment {{publicRef}} at {{organizationName}}.",
    ),
    inAppTemplate(
      "assignment.received",
      "New assignment",
      "Assignment {{publicRef}} received.",
    ),

    emailTemplate(
      "assignment.reminder",
      "Assignment reminder — {{publicRef}}",
      "Hi {{recipientName}}, reminder: assignment {{publicRef}} is due soon for {{organizationName}}.",
    ),
    inAppTemplate(
      "assignment.reminder",
      "Assignment reminder",
      "Reminder for assignment {{publicRef}}.",
    ),

    emailTemplate(
      "assignment.expired",
      "Assignment expired — {{publicRef}}",
      "Hi {{recipientName}}, assignment {{publicRef}} expired at {{organizationName}}.",
    ),
    inAppTemplate(
      "assignment.expired",
      "Assignment expired",
      "Assignment {{publicRef}} expired.",
    ),

    // ── Marketplace ───────────────────────────────────
    emailTemplate(
      "marketplace.listing_approved",
      "Listing approved — {{publicRef}}",
      "Hi {{recipientName}}, listing {{publicRef}} was approved for {{organizationName}}.",
    ),
    inAppTemplate(
      "marketplace.listing_approved",
      "Listing approved",
      "Listing {{publicRef}} approved.",
    ),

    emailTemplate(
      "marketplace.listing_rejected",
      "Listing rejected — {{publicRef}}",
      "Hi {{recipientName}}, listing {{publicRef}} was rejected for {{organizationName}}. {{decisionSummary}}",
      ["decisionSummary"],
    ),
    inAppTemplate(
      "marketplace.listing_rejected",
      "Listing rejected",
      "Listing {{publicRef}} rejected.",
      ["decisionSummary"],
    ),

    emailTemplate(
      "marketplace.offer_received",
      "New offer — {{publicRef}}",
      "Hi {{recipientName}}, you received an offer {{publicRef}} at {{organizationName}}. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    inAppTemplate(
      "marketplace.offer_received",
      "Offer received",
      "Offer {{publicRef}} received.",
      ["amountLabel"],
    ),

    emailTemplate(
      "marketplace.offer_accepted",
      "Offer accepted — {{publicRef}}",
      "Hi {{recipientName}}, offer {{publicRef}} was accepted at {{organizationName}}.",
    ),
    inAppTemplate(
      "marketplace.offer_accepted",
      "Offer accepted",
      "Offer {{publicRef}} accepted.",
    ),

    // ── Payments ──────────────────────────────────────
    emailTemplate(
      "payment.receipt",
      "Payment receipt — {{publicRef}}",
      "Hi {{recipientName}}, payment {{publicRef}} received for {{organizationName}}. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    inAppTemplate(
      "payment.receipt",
      "Payment receipt",
      "Payment {{publicRef}} · {{amountLabel}}.",
      ["amountLabel"],
    ),

    emailTemplate(
      "payment.refund_processed",
      "Refund processed — {{publicRef}}",
      "Hi {{recipientName}}, refund {{publicRef}} was processed for {{organizationName}}. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    inAppTemplate(
      "payment.refund_processed",
      "Refund processed",
      "Refund {{publicRef}} · {{amountLabel}}.",
      ["amountLabel"],
    ),

    emailTemplate(
      "withdrawal.requested",
      "Withdrawal requested — {{publicRef}}",
      "Hi {{recipientName}}, withdrawal {{publicRef}} was requested. Amount: {{amountLabel}}.",
      ["amountLabel"],
    ),
    inAppTemplate(
      "withdrawal.requested",
      "Withdrawal requested",
      "Withdrawal {{publicRef}} requested.",
      ["amountLabel"],
    ),

    // ── Digests / security ────────────────────────────
    emailTemplate(
      "digest.daily_summary",
      "Your daily Zolanzo summary",
      "Hi {{recipientName}}, here is your daily summary for {{organizationName}}: {{summaryText}}",
      ["summaryText"],
    ),
    inAppTemplate(
      "digest.daily_summary",
      "Daily summary",
      "{{summaryText}}",
      ["summaryText"],
    ),

    emailTemplate(
      "digest.weekly",
      "Your weekly Zolanzo digest",
      "Hi {{recipientName}}, weekly digest for {{organizationName}}: {{summaryText}}",
      ["summaryText"],
    ),
    inAppTemplate(
      "digest.weekly",
      "Weekly digest",
      "{{summaryText}}",
      ["summaryText"],
    ),

    brandedAuthEmailTemplate(
      "security.alert",
      "Security alert — {{organizationName}}",
      "Hi {{recipientName}}, security alert for {{organizationName}}: {{alertText}} Ref: {{publicRef}}.",
      {
        kicker: "Security Alert",
        heading: "Security alert",
        body: "{{alertText}} Reference: {{publicRef}}.",
        note: "If you do not recognize this activity, contact support immediately.",
      },
      ["alertText"],
    ),
    inAppTemplate(
      "security.alert",
      "Security alert",
      "{{alertText}}",
      ["alertText"],
    ),
    smsTemplate(
      "security.alert",
      "ZOLANZO security: {{alertText}} ({{publicRef}})",
      ["alertText"],
    ),
    whatsappTemplate(
      "security.alert",
      "Security alert: {{alertText}}. Ref {{publicRef}}.",
      ["alertText"],
    ),

    // ── Auth SMS / WhatsApp ───────────────────────────
    brandedAuthEmailTemplate(
      "auth.otp",
      "Your verification code",
      "Hi {{recipientName}}, your {{organizationName}} code is {{otpCode}}. It expires soon.",
      {
        kicker: "Verification Code",
        heading: "Your verification code",
        body: "Use this {{organizationName}} code to continue. It expires soon. Do not share it.",
        code: "{{otpCode}}",
      },
      ["otpCode"],
    ),
    inAppTemplate(
      "auth.otp",
      "Verification code",
      "Your code is {{otpCode}}.",
      ["otpCode"],
    ),
    smsTemplate(
      "auth.otp",
      "ZOLANZO: Your verification code is {{otpCode}}. It expires in 20 minutes. Do not share this code with anyone.",
      ["otpCode"],
    ),
    whatsappTemplate(
      "auth.otp",
      "Your Zolanzo verification code is {{otpCode}}.",
      ["otpCode"],
    ),

    brandedAuthEmailTemplate(
      "auth.login_verification",
      "Confirm your login",
      "Hi {{recipientName}}, confirm login to {{organizationName}}: {{actionUrl}}",
      {
        kicker: "Login Confirmation",
        heading: "Confirm your login",
        body: "A sign-in to {{organizationName}} needs confirmation.",
        actionLabel: "Confirm login",
        actionUrl: "{{actionUrl}}",
        note: "If this was not you, ignore this email and contact support.",
      },
      ["actionUrl"],
    ),
    inAppTemplate(
      "auth.login_verification",
      "Confirm login",
      "Confirm login: {{actionUrl}}",
      ["actionUrl"],
    ),
    smsTemplate(
      "auth.login_verification",
      "ZOLANZO: Confirm login {{actionUrl}}",
      ["actionUrl"],
    ),
    whatsappTemplate(
      "auth.login_verification",
      "Confirm your Zolanzo login: {{actionUrl}}",
      ["actionUrl"],
    ),

    brandedAuthEmailTemplate(
      "security.new_device",
      "New device sign-in",
      "Hi {{recipientName}}, a new device signed in to {{organizationName}}. {{deviceLabel}}",
      {
        kicker: "Security Alert",
        heading: "New device sign-in",
        body: "A new device signed in to your {{organizationName}} account. {{deviceLabel}}",
        note: "If this was not you, reset your PIN and contact support.",
      },
      ["deviceLabel"],
    ),
    inAppTemplate(
      "security.new_device",
      "New device",
      "New device: {{deviceLabel}}",
      ["deviceLabel"],
    ),
    smsTemplate(
      "security.new_device",
      "ZOLANZO: New device sign-in ({{deviceLabel}}).",
      ["deviceLabel"],
    ),
    whatsappTemplate(
      "security.new_device",
      "New device signed in: {{deviceLabel}}.",
      ["deviceLabel"],
    ),

    brandedAuthEmailTemplate(
      "security.password_changed",
      "Password changed",
      "Hi {{recipientName}}, your {{organizationName}} password was changed. If this wasn't you, reset it immediately.",
      {
        kicker: "Security Alert",
        heading: "Your password was changed",
        body: "The password on your {{organizationName}} account was changed. If this was not you, reset it immediately.",
      },
    ),
    inAppTemplate(
      "security.password_changed",
      "Password changed",
      "Your password was changed.",
    ),
    smsTemplate(
      "security.password_changed",
      `ZOLANZO: Your password was changed. WhatsApp ${APP_CONFIG.supportWhatsApp.display} if unexpected.`,
    ),
    whatsappTemplate(
      "security.password_changed",
      `Your Zolanzo password was changed. WhatsApp ${APP_CONFIG.supportWhatsApp.display} if unexpected.`,
    ),

    brandedAuthEmailTemplate(
      "security.suspicious_activity",
      "Suspicious activity detected",
      "Hi {{recipientName}}, suspicious activity on {{organizationName}}: {{alertText}} Ref: {{publicRef}}.",
      {
        kicker: "Security Alert",
        heading: "Suspicious activity detected",
        body: "{{alertText}} Reference: {{publicRef}}.",
        note: "If this was not you, reset your PIN and contact support immediately.",
      },
      ["alertText"],
    ),
    inAppTemplate(
      "security.suspicious_activity",
      "Suspicious activity",
      "{{alertText}}",
      ["alertText"],
    ),
    smsTemplate(
      "security.suspicious_activity",
      "ZOLANZO alert: {{alertText}} ({{publicRef}})",
      ["alertText"],
    ),
    whatsappTemplate(
      "security.suspicious_activity",
      "Suspicious activity: {{alertText}}. Ref {{publicRef}}.",
      ["alertText"],
    ),

    // SMS / WhatsApp for high-signal existing events
    smsTemplate(
      "payment.receipt",
      "ZOLANZO: Payment {{publicRef}} received ({{amountLabel}}).",
      ["amountLabel"],
    ),
    whatsappTemplate(
      "payment.receipt",
      "Payment {{publicRef}} received. Amount {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "payment.refund_processed",
      "ZOLANZO: Refund {{publicRef}} processed ({{amountLabel}}).",
      ["amountLabel"],
    ),
    whatsappTemplate(
      "payment.refund_processed",
      "Refund {{publicRef}} processed. Amount {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "withdrawal.requested",
      "ZOLANZO: Withdrawal {{publicRef}} requested ({{amountLabel}}).",
      ["amountLabel"],
    ),
    whatsappTemplate(
      "withdrawal.requested",
      "Withdrawal {{publicRef}} requested. Amount {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "withdrawal.approved",
      "ZOLANZO: Withdrawal {{publicRef}} approved ({{amountLabel}}).",
      ["amountLabel"],
    ),
    whatsappTemplate(
      "withdrawal.approved",
      "Withdrawal {{publicRef}} approved. Amount {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "withdrawal.completed",
      "ZOLANZO: Withdrawal {{publicRef}} completed ({{amountLabel}}).",
      ["amountLabel"],
    ),
    whatsappTemplate(
      "withdrawal.completed",
      "Withdrawal {{publicRef}} completed. Amount {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "assignment.received",
      "ZOLANZO: New assignment {{publicRef}}.",
    ),
    whatsappTemplate(
      "assignment.received",
      "You received assignment {{publicRef}}.",
    ),
    smsTemplate(
      "assignment.reminder",
      "ZOLANZO: Reminder for assignment {{publicRef}}.",
    ),
    whatsappTemplate(
      "assignment.reminder",
      "Reminder: assignment {{publicRef}} is due soon.",
    ),
    smsTemplate(
      "assignment.expired",
      "ZOLANZO: Assignment {{publicRef}} expired.",
    ),
    whatsappTemplate(
      "assignment.expired",
      "Assignment {{publicRef}} has expired.",
    ),
    smsTemplate(
      "marketplace.offer_received",
      "ZOLANZO: Offer {{publicRef}} received ({{amountLabel}}).",
      ["amountLabel"],
    ),
    whatsappTemplate(
      "marketplace.offer_received",
      "New offer {{publicRef}}. Amount {{amountLabel}}.",
      ["amountLabel"],
    ),
    smsTemplate(
      "marketplace.listing_approved",
      "ZOLANZO: Listing {{publicRef}} approved.",
    ),
    whatsappTemplate(
      "marketplace.listing_approved",
      "Listing {{publicRef}} was approved.",
    ),
    smsTemplate(
      "marketplace.listing_rejected",
      "ZOLANZO: Listing {{publicRef}} rejected.",
      ["decisionSummary"],
    ),
    whatsappTemplate(
      "marketplace.listing_rejected",
      "Listing {{publicRef}} was rejected.",
      ["decisionSummary"],
    ),
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
