/**
 * Channel fallback policies — e.g. SMS failure → optional email.
 * Domain stays channel-agnostic; hub applies policy after adapter failure.
 */

import "server-only";

import type { NotificationChannel } from "@/constants/notification";
import type { NotificationHubEvent } from "@/constants/notification";

export type ChannelFallbackPolicy = {
  /** When primary channel fails after retries exhausted / immediate fail */
  onFailure?: Partial<Record<NotificationChannel, NotificationChannel[]>>;
};

export const DEFAULT_CHANNEL_FALLBACK: ChannelFallbackPolicy = {
  onFailure: {
    sms: ["email"],
    whatsapp: ["sms", "email"],
  },
};

export function resolveFallbackChannels(params: {
  failedChannel: NotificationChannel;
  policy?: ChannelFallbackPolicy;
  enabled?: boolean;
}): NotificationChannel[] {
  if (params.enabled === false) return [];
  const policy = params.policy ?? DEFAULT_CHANNEL_FALLBACK;
  return policy.onFailure?.[params.failedChannel] ?? [];
}

/** Events where SMS→email fallback is encouraged by default. */
export function shouldAttemptSmsEmailFallback(
  event: NotificationHubEvent,
): boolean {
  return (
    event.startsWith("auth.") ||
    event.startsWith("payment.") ||
    event.startsWith("withdrawal.") ||
    event.startsWith("security.")
  );
}
