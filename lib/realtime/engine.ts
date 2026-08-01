import {
  RealtimeChannel,
  RealtimeEventPayload,
  RealtimeEventType,
  RealtimeState,
  SubscriptionCallback,
} from "./types";
import { ChannelManager } from "./channels";
import { EventPublisher } from "./publisher";

type StateListener = (state: RealtimeState) => void;

class ZolanzoRealtimeEngine {
  private channelManager: ChannelManager;
  private publisher: EventPublisher;
  private stateListeners: Set<StateListener> = new Set();
  private eventCount = 0;
  private lastEvent: RealtimeEventPayload | null = null;
  private providerMode: "mock" | "supabase" = "mock";

  constructor() {
    this.channelManager = new ChannelManager();
    this.publisher = new EventPublisher(this.channelManager);

    // Global listener to track metrics
    this.channelManager.subscribeToChannel("ALL", (evt) => {
      this.eventCount += 1;
      this.lastEvent = evt;
      this.notifyStateListeners();
    });
  }

  // 1. PUBLISH API
  public publish<T = Record<string, unknown>>(
    type: RealtimeEventType,
    data: T,
    options?: { isOptimistic?: boolean }
  ): RealtimeEventPayload<T> {
    return this.publisher.publish(type, data, options);
  }

  public publishOptimistic<T = Record<string, unknown>>(
    type: RealtimeEventType,
    data: T,
    action: () => Promise<void> | void,
    onRollback?: (error: unknown) => void
  ): RealtimeEventPayload<T> {
    return this.publisher.publishOptimistic(type, data, action, onRollback);
  }

  // 2. SUBSCRIBE API
  public subscribeChannel<T = Record<string, unknown>>(
    channel: RealtimeChannel | "ALL",
    callback: SubscriptionCallback<T>
  ): () => void {
    return this.channelManager.subscribeToChannel(
      channel,
      callback as SubscriptionCallback
    );
  }

  public subscribeEvent<T = Record<string, unknown>>(
    eventType: RealtimeEventType,
    callback: SubscriptionCallback<T>
  ): () => void {
    return this.channelManager.subscribeToEvent(
      eventType,
      callback as SubscriptionCallback
    );
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.getState());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // 3. ENGINE CONTROLS & DIAGNOSTICS
  public getState(): RealtimeState {
    return {
      isConnected: this.publisher.getIsOnline(),
      activeChannels: this.channelManager.getActiveChannels(),
      eventCount: this.eventCount,
      lastEvent: this.lastEvent,
      queuedCount: this.publisher.getQueueSize(),
    };
  }

  public getHistory(): RealtimeEventPayload[] {
    return this.publisher.getHistory();
  }

  public setOnline(online: boolean): void {
    this.publisher.setOnlineStatus(online);
    this.notifyStateListeners();
  }

  public replayQueue(): number {
    const replayed = this.publisher.replayQueue();
    this.notifyStateListeners();
    return replayed;
  }

  public setProviderMode(mode: "mock" | "supabase"): void {
    this.providerMode = mode;
    console.warn(`[Realtime Engine] Switched provider transport to: ${mode}`);
  }

  public getProviderMode(): "mock" | "supabase" {
    return this.providerMode;
  }

  private notifyStateListeners(): void {
    const currentState = this.getState();
    this.stateListeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error("[Realtime Engine] Error notifying state listener:", err);
      }
    });
  }
}

export const zolanzoRealtime = new ZolanzoRealtimeEngine();
