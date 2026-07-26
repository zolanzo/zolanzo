/**
 * Notification channel adapter registry — select by key, channel, or capabilities.
 */

import type {
  ChannelCapability,
  NotificationChannel,
  NotificationChannelAdapter,
} from "@/lib/integrations/types";
import {
  adapterHasCapabilities,
  adapterSupportsChannel,
} from "@/lib/integrations/notifications/stub-factory";
import { memoryNotificationAdapter } from "@/lib/integrations/notifications/memory-adapter";
import { resendNotificationAdapter } from "@/lib/integrations/notifications/resend-adapter";
import { smtpNotificationAdapter } from "@/lib/integrations/notifications/smtp-adapter";
import { sendchampNotificationAdapter } from "@/lib/integrations/notifications/sendchamp-adapter";
import { firebaseNotificationAdapter } from "@/lib/integrations/notifications/firebase-adapter";
import { webhookNotificationAdapter } from "@/lib/integrations/notifications/webhook-adapter";
import { inAppNotificationAdapter } from "@/lib/integrations/notifications/in-app-adapter";
import { integrationRegistry } from "@/lib/integrations/registry";

const BUILTIN: NotificationChannelAdapter[] = [
  memoryNotificationAdapter,
  resendNotificationAdapter,
  smtpNotificationAdapter,
  sendchampNotificationAdapter,
  firebaseNotificationAdapter,
  webhookNotificationAdapter,
  inAppNotificationAdapter,
];

export function listNotificationAdapters(): NotificationChannelAdapter[] {
  const fromRegistry = integrationRegistry.notifications ?? [];
  const keys = new Set(fromRegistry.map((a) => a.providerKey));
  return [
    ...fromRegistry,
    ...BUILTIN.filter((a) => !keys.has(a.providerKey)),
  ];
}

export function getNotificationAdapter(
  providerKey: string,
): NotificationChannelAdapter | null {
  return (
    listNotificationAdapters().find((a) => a.providerKey === providerKey) ??
    null
  );
}

export function selectNotificationAdapter(params: {
  providerKey?: string;
  channel: NotificationChannel;
  requiredCapabilities?: readonly ChannelCapability[];
  /** Prefer memory for local/test delivery */
  preferLive?: boolean;
}): NotificationChannelAdapter {
  if (params.providerKey) {
    const found = getNotificationAdapter(params.providerKey);
    if (!found) {
      throw new Error(`Unknown notification provider: ${params.providerKey}`);
    }
    if (!adapterSupportsChannel(found, params.channel)) {
      throw new Error(
        `Provider ${params.providerKey} does not support channel ${params.channel}`,
      );
    }
    if (
      params.requiredCapabilities &&
      !adapterHasCapabilities(found, params.requiredCapabilities)
    ) {
      throw new Error(
        `Provider ${params.providerKey} missing required capabilities`,
      );
    }
    return found;
  }

  const adapters = listNotificationAdapters().filter((a) =>
    adapterSupportsChannel(a, params.channel),
  );

  if (params.preferLive) {
    const live = adapters.find((a) => a.providerKey === "memory");
    if (live) return live;
  }

  const required = params.requiredCapabilities ?? [];
  const match =
    adapters.find((a) => adapterHasCapabilities(a, required)) ??
    adapters[0];

  if (!match) {
    throw new Error(
      `No notification adapter supports channel ${params.channel}`,
    );
  }
  return match;
}

/** Default adapter key per channel (stubs — memory for live local). */
export const DEFAULT_ADAPTER_BY_CHANNEL: Record<
  NotificationChannel,
  string
> = {
  email: "resend",
  sms: "sendchamp",
  push: "firebase",
  in_app: "in_app",
  webhook: "webhook",
};

export {
  memoryNotificationAdapter,
  resendNotificationAdapter,
  smtpNotificationAdapter,
  sendchampNotificationAdapter,
  firebaseNotificationAdapter,
  webhookNotificationAdapter,
  inAppNotificationAdapter,
};
