/**
 * Notification Hub enums — provider-agnostic.
 */

export const NOTIFICATION_CHANNELS = [
  "email",
  "sms",
  "push",
  "in_app",
  "webhook",
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const CHANNEL_ADAPTER_KEYS = [
  "memory",
  "resend",
  "smtp",
  "sendchamp",
  "firebase",
  "webhook",
  "in_app",
] as const;

export type ChannelAdapterKey = (typeof CHANNEL_ADAPTER_KEYS)[number];

export const CHANNEL_CAPABILITIES = [
  "email",
  "sms",
  "push",
  "in_app",
  "webhook",
  "templates",
  "batch",
  "priority",
] as const;

export type ChannelCapability = (typeof CHANNEL_CAPABILITIES)[number];

export const NOTIFICATION_HUB_EVENTS = [
  "review.approved",
  "review.rejected",
  "review.revision_requested",
  "settlement.completed",
  "withdrawal.approved",
  "withdrawal.completed",
  "campaign.funded",
  "assignment.claimed",
  "submission.received",
] as const;

export type NotificationHubEvent = (typeof NOTIFICATION_HUB_EVENTS)[number];

/** Maps hub event names → domain event names where they differ. */
export const HUB_EVENT_TO_DOMAIN: Record<
  NotificationHubEvent,
  string
> = {
  "review.approved": "review.approved",
  "review.rejected": "review.rejected",
  "review.revision_requested": "review.revision_requested",
  "settlement.completed": "settlement.batch_settled",
  "withdrawal.approved": "withdrawal.approved",
  "withdrawal.completed": "withdrawal.completed",
  "campaign.funded": "campaign.funded",
  "assignment.claimed": "assignment.claimed",
  "submission.received": "submission.submitted",
};

export const RECIPIENT_ROLES = [
  "worker",
  "client",
  "organization_member",
  "reviewer",
  "admin",
] as const;

export type RecipientRole = (typeof RECIPIENT_ROLES)[number];

export const DELIVERY_POLICY_MODES = [
  "immediate",
  "delayed",
  "scheduled",
  "retry",
  "quiet_hours",
  "batch",
  "digest",
] as const;

export type DeliveryPolicyMode = (typeof DELIVERY_POLICY_MODES)[number];

export const DIGEST_FREQUENCIES = [
  "none",
  "daily",
  "weekly",
] as const;

export type DigestFrequency = (typeof DIGEST_FREQUENCIES)[number];

export const NOTIFICATION_INTENT_STATUSES = [
  "draft",
  "jobs_created",
  "partially_delivered",
  "delivered",
  "failed",
  "cancelled",
  "suppressed",
] as const;

export type NotificationIntentStatus =
  (typeof NOTIFICATION_INTENT_STATUSES)[number];

export const NOTIFICATION_JOB_STATUSES = [
  "scheduled",
  "queued",
  "delivering",
  "delivered",
  "failed",
  "cancelled",
  "skipped",
] as const;

export type NotificationJobStatus =
  (typeof NOTIFICATION_JOB_STATUSES)[number];

export const NOTIFICATION_PRIORITIES = [
  "low",
  "normal",
  "high",
  "critical",
] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const PREFERENCE_SCOPES = ["user", "organization"] as const;

export type PreferenceScope = (typeof PREFERENCE_SCOPES)[number];
