/**
 * @module features/notifications/services
 */
export {
  createNotificationIntent,
  dispatchNotificationJob,
  emitNotificationFromDomainEvent,
  upsertNotificationPreference,
} from "@/features/notifications/services/notification-hub";
export { safeEmitDomainNotification } from "@/features/notifications/services/safe-emit";
export {
  BUILTIN_NOTIFICATION_TEMPLATES,
  findBuiltinTemplate,
  renderNotificationTemplate,
  renderTemplateString,
  templateKeyForEvent,
} from "@/features/notifications/services/templates";
export {
  buildPolicySnapshot,
  computeRetrySchedule,
  DEFAULT_POLICY,
  evaluateDeliverySchedule,
  isWithinWindow,
  localMinutesOfDay,
} from "@/features/notifications/services/policies";
export {
  defaultUserPreference,
  filterChannelsByPreference,
  isEventSubscribed,
  mergePreferences,
  preferenceSubjectKey,
} from "@/features/notifications/services/preferences";
export {
  addressForChannel,
  resolveRecipients,
} from "@/features/notifications/services/recipients";
