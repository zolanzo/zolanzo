/**
 * Notification Hub enums — provider-agnostic.
 */

export const NOTIFICATION_CHANNELS = [
  "email",
  "sms",
  "whatsapp",
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
  "whatsapp",
  "push",
  "in_app",
  "webhook",
  "templates",
  "batch",
  "priority",
] as const;

export type ChannelCapability = (typeof CHANNEL_CAPABILITIES)[number];

export const NOTIFICATION_HUB_EVENTS = [
  // Existing domain ops
  "review.approved",
  "review.rejected",
  "review.revision_requested",
  "settlement.completed",
  "withdrawal.approved",
  "withdrawal.completed",
  "campaign.funded",
  "assignment.claimed",
  "submission.received",
  // Auth
  "auth.welcome",
  "auth.email_verification",
  "auth.password_reset",
  "auth.magic_link",
  // Organizations
  "org.invite_member",
  "org.invite_accepted",
  "org.invite_revoked",
  // Campaigns / assignments
  "campaign.published",
  "assignment.received",
  "assignment.reminder",
  "assignment.expired",
  // Marketplace
  "marketplace.listing_approved",
  "marketplace.listing_rejected",
  "marketplace.offer_received",
  "marketplace.offer_accepted",
  // Payments
  "payment.receipt",
  "payment.refund_processed",
  "withdrawal.requested",
  // Digests / security
  "digest.daily_summary",
  "digest.weekly",
  "security.alert",
  // Auth SMS / WhatsApp
  "auth.otp",
  "auth.login_verification",
  // Security SMS
  "security.new_device",
  "security.password_changed",
  "security.suspicious_activity",
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
  "auth.welcome": "auth.welcome",
  "auth.email_verification": "auth.email_verification",
  "auth.password_reset": "auth.password_reset",
  "auth.magic_link": "auth.magic_link",
  "org.invite_member": "organization.member_invited",
  "org.invite_accepted": "organization.member_joined",
  "org.invite_revoked": "organization.invite_revoked",
  "campaign.published": "campaign.published",
  "assignment.received": "assignment.assigned",
  "assignment.reminder": "assignment.reminder",
  "assignment.expired": "assignment.expired",
  "marketplace.listing_approved": "marketplace.listing_approved",
  "marketplace.listing_rejected": "marketplace.listing_rejected",
  "marketplace.offer_received": "marketplace.offer_received",
  "marketplace.offer_accepted": "marketplace.offer_accepted",
  "payment.receipt": "payment.succeeded",
  "payment.refund_processed": "payment.refunded",
  "withdrawal.requested": "withdrawal.requested",
  "digest.daily_summary": "notification.digest_daily",
  "digest.weekly": "notification.digest_weekly",
  "security.alert": "security.alert",
  "auth.otp": "auth.otp",
  "auth.login_verification": "auth.login_verification",
  "security.new_device": "security.new_device",
  "security.password_changed": "security.password_changed",
  "security.suspicious_activity": "security.suspicious_activity",
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
  "dead_lettered",
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
