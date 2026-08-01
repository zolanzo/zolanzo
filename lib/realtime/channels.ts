import { RealtimeChannel, SubscriptionCallback, RealtimeEventPayload, RealtimeEventType } from "./types";

type ListenerMap = Map<RealtimeChannel | "ALL", Set<SubscriptionCallback>>;
type TypeListenerMap = Map<RealtimeEventType, Set<SubscriptionCallback>>;

export class ChannelManager {
  private channelListeners: ListenerMap = new Map();
  private typeListeners: TypeListenerMap = new Map();
  private activeChannels: Set<RealtimeChannel> = new Set(["global"]);

  public subscribeToChannel(
    channel: RealtimeChannel | "ALL",
    callback: SubscriptionCallback
  ): () => void {
    if (!this.channelListeners.has(channel)) {
      this.channelListeners.set(channel, new Set());
    }
    const listeners = this.channelListeners.get(channel)!;
    listeners.add(callback);

    if (channel !== "ALL") {
      this.activeChannels.add(channel);
    }

    // Return unsubscription function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0 && channel !== "ALL") {
        this.activeChannels.delete(channel);
      }
    };
  }

  public subscribeToEvent(
    eventType: RealtimeEventType,
    callback: SubscriptionCallback
  ): () => void {
    if (!this.typeListeners.has(eventType)) {
      this.typeListeners.set(eventType, new Set());
    }
    const listeners = this.typeListeners.get(eventType)!;
    listeners.add(callback);

    return () => {
      listeners.delete(callback);
    };
  }

  public dispatch<T = Record<string, unknown>>(event: RealtimeEventPayload<T>): void {
    // 1. Specific channel listeners
    const channelSubs = this.channelListeners.get(event.channel);
    if (channelSubs) {
      channelSubs.forEach((cb) => {
        try {
          cb(event as RealtimeEventPayload);
        } catch (e) {
          console.error(`[Realtime Engine] Error in channel listener (${event.channel}):`, e);
        }
      });
    }

    // 2. Event type listeners
    const typeSubs = this.typeListeners.get(event.type);
    if (typeSubs) {
      typeSubs.forEach((cb) => {
        try {
          cb(event as RealtimeEventPayload);
        } catch (e) {
          console.error(`[Realtime Engine] Error in event type listener (${event.type}):`, e);
        }
      });
    }

    // 3. Catch-all listeners
    const allSubs = this.channelListeners.get("ALL");
    if (allSubs) {
      allSubs.forEach((cb) => {
        try {
          cb(event as RealtimeEventPayload);
        } catch (e) {
          console.error("[Realtime Engine] Error in global event listener:", e);
        }
      });
    }
  }

  public getActiveChannels(): RealtimeChannel[] {
    return Array.from(this.activeChannels);
  }

  public clearAll(): void {
    this.channelListeners.clear();
    this.typeListeners.clear();
    this.activeChannels.clear();
    this.activeChannels.add("global");
  }
}
