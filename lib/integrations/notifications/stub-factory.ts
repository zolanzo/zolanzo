/**
 * Shared helpers for notification channel adapter stubs.
 */

import type {
  ChannelCapability,
  ChannelDeliveryInput,
  ChannelDeliveryResult,
  NotificationChannel,
  NotificationChannelAdapter,
} from "@/lib/integrations/types";

export function createStubChannelAdapter(params: {
  providerKey: string;
  channels: readonly NotificationChannel[];
  capabilities: readonly ChannelCapability[];
  /** Only memory performs real (in-process) delivery */
  deliverLive?: boolean;
}): NotificationChannelAdapter {
  const { providerKey, channels, capabilities, deliverLive = false } = params;

  return {
    providerKey,
    channels,
    capabilities,

    async deliver(
      input: ChannelDeliveryInput,
    ): Promise<ChannelDeliveryResult> {
      if (!channels.includes(input.channel)) {
        return {
          provider: providerKey,
          providerRef: `${providerKey}_unsupported`,
          status: "failed",
          failureReason: `Adapter ${providerKey} does not support channel ${input.channel}`,
        };
      }

      if (!deliverLive) {
        return {
          provider: providerKey,
          providerRef: `${providerKey}_stub_${input.idempotencyKey.slice(0, 24)}`,
          status: "queued",
          failureReason: undefined,
          raw: {
            stub: true,
            accepted: false,
            reason: "Live delivery deferred — adapter stub only",
            channel: input.channel,
            to: input.to,
          },
        };
      }

      const providerRef = `${providerKey}_${input.idempotencyKey.slice(0, 32)}`;
      return {
        provider: providerKey,
        providerRef,
        status: "delivered",
        deliveredAt: new Date().toISOString(),
        raw: {
          memory: true,
          channel: input.channel,
          to: input.to,
          subject: input.subject ?? null,
          bodyText: input.bodyText,
        },
      };
    },
  };
}

export function adapterSupportsChannel(
  adapter: NotificationChannelAdapter,
  channel: NotificationChannel,
): boolean {
  return adapter.channels.includes(channel);
}

export function adapterHasCapabilities(
  adapter: NotificationChannelAdapter,
  required: readonly ChannelCapability[],
): boolean {
  const set = new Set(adapter.capabilities);
  return required.every((c) => set.has(c));
}
