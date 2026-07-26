/**
 * Notification preferences — first-class domain concept.
 */

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_HUB_EVENTS,
  type DigestFrequency,
  type NotificationChannel,
  type NotificationHubEvent,
  type PreferenceScope,
} from "@/constants/notification";
import type { QuietHoursConfig } from "@/features/notifications/services/policies";

export type ResolvedNotificationPreference = {
  scope: PreferenceScope;
  userId: string | null;
  organizationId: string | null;
  enabledChannels: NotificationChannel[];
  quietHours: QuietHoursConfig | null;
  timezone: string;
  locale: string;
  eventSubscriptions: NotificationHubEvent[] | null;
  digestFrequency: DigestFrequency;
  dndWindows: QuietHoursConfig[];
};

export function preferenceSubjectKey(
  scope: PreferenceScope,
  id: string,
): string {
  return scope === "user" ? `user:${id}` : `org:${id}`;
}

export function defaultUserPreference(
  userId: string,
): ResolvedNotificationPreference {
  return {
    scope: "user",
    userId,
    organizationId: null,
    enabledChannels: [...NOTIFICATION_CHANNELS],
    quietHours: null,
    timezone: "UTC",
    locale: "en",
    eventSubscriptions: null,
    digestFrequency: "none",
    dndWindows: [],
  };
}

export function mergePreferences(params: {
  user?: ResolvedNotificationPreference | null;
  organization?: ResolvedNotificationPreference | null;
}): ResolvedNotificationPreference {
  const org = params.organization;
  const user = params.user;

  if (!user && !org) {
    return defaultUserPreference("anonymous");
  }

  const orgChannels = org?.enabledChannels;
  const userChannels = user?.enabledChannels;

  let enabledChannels = userChannels ?? orgChannels ?? [...NOTIFICATION_CHANNELS];
  if (orgChannels && userChannels) {
    const orgSet = new Set(orgChannels);
    enabledChannels = userChannels.filter((c) => orgSet.has(c));
  }

  return {
    scope: user ? "user" : "organization",
    userId: user?.userId ?? null,
    organizationId: org?.organizationId ?? user?.organizationId ?? null,
    enabledChannels,
    quietHours: user?.quietHours ?? org?.quietHours ?? null,
    timezone: user?.timezone ?? org?.timezone ?? "UTC",
    locale: user?.locale ?? org?.locale ?? "en",
    eventSubscriptions:
      user?.eventSubscriptions ?? org?.eventSubscriptions ?? null,
    digestFrequency: user?.digestFrequency ?? org?.digestFrequency ?? "none",
    dndWindows: [
      ...(org?.dndWindows ?? []),
      ...(user?.dndWindows ?? []),
    ],
  };
}

export function isEventSubscribed(
  preference: ResolvedNotificationPreference,
  event: NotificationHubEvent,
): boolean {
  if (!preference.eventSubscriptions) return true;
  if (preference.eventSubscriptions.length === 0) return true;
  return preference.eventSubscriptions.includes(event);
}

export function filterChannelsByPreference(params: {
  preference: ResolvedNotificationPreference;
  requested: readonly NotificationChannel[];
  event: NotificationHubEvent;
}): NotificationChannel[] {
  if (!isEventSubscribed(params.preference, params.event)) {
    return [];
  }
  const enabled = new Set(params.preference.enabledChannels);
  return params.requested.filter((c) => enabled.has(c));
}

export function parsePreferenceRow(row: {
  scope: string;
  userId: string | null;
  organizationId: string | null;
  enabledChannels: unknown;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  locale: string;
  eventSubscriptions: unknown;
  digestFrequency: string;
  dndWindows: unknown;
}): ResolvedNotificationPreference {
  const channels = Array.isArray(row.enabledChannels)
    ? (row.enabledChannels as string[]).filter((c): c is NotificationChannel =>
        (NOTIFICATION_CHANNELS as readonly string[]).includes(c),
      )
    : [...NOTIFICATION_CHANNELS];

  const subscriptions = Array.isArray(row.eventSubscriptions)
    ? (row.eventSubscriptions as string[]).filter(
        (e): e is NotificationHubEvent =>
          (NOTIFICATION_HUB_EVENTS as readonly string[]).includes(e),
      )
    : null;

  const dnd = Array.isArray(row.dndWindows)
    ? (row.dndWindows as QuietHoursConfig[]).filter(
        (w) =>
          typeof w?.start === "string" && typeof w?.end === "string",
      )
    : [];

  return {
    scope: row.scope === "organization" ? "organization" : "user",
    userId: row.userId,
    organizationId: row.organizationId,
    enabledChannels: channels,
    quietHours:
      row.quietHoursStart && row.quietHoursEnd
        ? { start: row.quietHoursStart, end: row.quietHoursEnd }
        : null,
    timezone: row.timezone,
    locale: row.locale,
    eventSubscriptions: subscriptions,
    digestFrequency: (["none", "daily", "weekly"] as const).includes(
      row.digestFrequency as DigestFrequency,
    )
      ? (row.digestFrequency as DigestFrequency)
      : "none",
    dndWindows: dnd,
  };
}
