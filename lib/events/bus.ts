/**
 * Event bus contract — architecture only.
 * Swap in Redis Streams / SQS / Supabase Queues / Inngest later.
 */

import type { DomainEvent, DomainEventName } from "@/constants/events";

export type EventHandler<TPayload = Record<string, unknown>> = (
  event: DomainEvent<TPayload>,
) => Promise<void>;

export type EventBus = {
  publish<TPayload>(event: DomainEvent<TPayload>): Promise<void>;
  subscribe<TPayload>(
    name: DomainEventName,
    handler: EventHandler<TPayload>,
  ): () => void;
};

/**
 * No-op bus for foundation boot. Replace in workers/ when infra is wired.
 */
export const noopEventBus: EventBus = {
  async publish() {
    // intentionally empty — architecture placeholder
  },
  subscribe() {
    return () => undefined;
  },
};
