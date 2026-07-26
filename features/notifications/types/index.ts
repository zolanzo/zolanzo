/**
 * @module features/notifications/types
 */
export type {
  ChannelAdapterKey,
  ChannelCapability,
  DeliveryPolicyMode,
  DigestFrequency,
  NotificationChannel,
  NotificationHubEvent,
  NotificationIntentStatus,
  NotificationJobStatus,
  NotificationPriority,
  PreferenceScope,
  RecipientRole,
} from "@/constants/notification";

export type {
  NotificationTemplateDefinition,
  RenderedNotification,
} from "@/features/notifications/services/templates";

export type {
  DeliveryPolicyConfig,
  PolicySnapshot,
  QuietHoursConfig,
  RetryConfig,
  ScheduleResult,
} from "@/features/notifications/services/policies";

export type {
  ResolvedNotificationPreference,
} from "@/features/notifications/services/preferences";

export type {
  RecipientHint,
  ResolvedRecipient,
} from "@/features/notifications/services/recipients";
