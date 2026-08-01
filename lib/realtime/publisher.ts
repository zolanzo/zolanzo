import { RealtimeEventPayload, QueuedEvent, RealtimeEventType } from "./types";
import { createRealtimeEvent } from "./events";
import { ChannelManager } from "./channels";

export class EventPublisher {
  private queue: QueuedEvent[] = [];
  private isOnline = true;
  private channelManager: ChannelManager;
  private history: RealtimeEventPayload<Record<string, unknown>>[] = [];
  private maxHistorySize = 100;

  constructor(channelManager: ChannelManager) {
    this.channelManager = channelManager;

    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", () => this.handleNetworkStatusChange(true));
      window.addEventListener("offline", () => this.handleNetworkStatusChange(false));
    }
  }

  public publish<T = Record<string, unknown>>(
    type: RealtimeEventType,
    data: T,
    options?: { isOptimistic?: boolean }
  ): RealtimeEventPayload<T> {
    const event = createRealtimeEvent(type, data, options);

    if (!this.isOnline) {
      this.queueEvent(event);
      return event;
    }

    this.dispatchAndRecord(event);
    return event;
  }

  public publishOptimistic<T = Record<string, unknown>>(
    type: RealtimeEventType,
    data: T,
    action: () => Promise<void> | void,
    onRollback?: (error: unknown) => void
  ): RealtimeEventPayload<T> {
    // 1. Immediately emit optimistic event
    const optimisticEvent = this.publish(type, data, { isOptimistic: true });

    // 2. Perform actual background action
    Promise.resolve()
      .then(() => action())
      .catch((err) => {
        console.warn(`[Realtime Engine] Optimistic action failed for ${type}. Rolling back...`, err);
        if (onRollback) {
          onRollback(err);
        }
      });

    return optimisticEvent;
  }

  private dispatchAndRecord<T = Record<string, unknown>>(event: RealtimeEventPayload<T>): void {
    this.history.unshift(event as unknown as RealtimeEventPayload<Record<string, unknown>>);
    if (this.history.length > this.maxHistorySize) {
      this.history.pop();
    }
    this.channelManager.dispatch(event);
  }

  private queueEvent<T = Record<string, unknown>>(event: RealtimeEventPayload<T>): void {
    this.queue.push({
      event: event as unknown as RealtimeEventPayload<Record<string, unknown>>,
      retryCount: 0,
      createdTime: Date.now(),
    });
  }

  private handleNetworkStatusChange(online: boolean): void {
    this.isOnline = online;
    if (online && this.queue.length > 0) {
      this.replayQueue();
    }
  }

  public replayQueue(): number {
    const count = this.queue.length;
    const items = [...this.queue];
    this.queue = [];

    items.forEach((item) => {
      this.dispatchAndRecord(item.event);
    });

    return count;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public getHistory(): RealtimeEventPayload[] {
    return [...this.history];
  }

  public setOnlineStatus(online: boolean): void {
    this.handleNetworkStatusChange(online);
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }
}
