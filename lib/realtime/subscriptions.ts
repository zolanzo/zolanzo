import { useEffect, useState, useCallback } from "react";
import { RealtimeChannel, RealtimeEventPayload, RealtimeEventType, RealtimeState } from "./types";
import { zolanzoRealtime } from "./engine";

/**
 * Hook to subscribe to a specific Realtime Channel.
 * Automatically unsubscribes on unmount.
 */
export function useRealtimeChannel<T = Record<string, unknown>>(
  channel: RealtimeChannel | "ALL",
  onEvent?: (event: RealtimeEventPayload<T>) => void
): RealtimeEventPayload<T> | null {
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload<T> | null>(null);

  const handleEvent = useCallback(
    (evt: RealtimeEventPayload<T>) => {
      setLastEvent(evt);
      if (onEvent) {
        onEvent(evt);
      }
    },
    [onEvent]
  );

  useEffect(() => {
    const unsubscribe = zolanzoRealtime.subscribeChannel<T>(channel, handleEvent);
    return () => {
      unsubscribe();
    };
  }, [channel, handleEvent]);

  return lastEvent;
}

/**
 * Hook to subscribe to a specific Realtime Event Type.
 * Automatically unsubscribes on unmount.
 */
export function useRealtimeEvent<T = Record<string, unknown>>(
  eventType: RealtimeEventType,
  onEvent?: (event: RealtimeEventPayload<T>) => void
): RealtimeEventPayload<T> | null {
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload<T> | null>(null);

  const handleEvent = useCallback(
    (evt: RealtimeEventPayload<T>) => {
      setLastEvent(evt);
      if (onEvent) {
        onEvent(evt);
      }
    },
    [onEvent]
  );

  useEffect(() => {
    const unsubscribe = zolanzoRealtime.subscribeEvent<T>(eventType, handleEvent);
    return () => {
      unsubscribe();
    };
  }, [eventType, handleEvent]);

  return lastEvent;
}

/**
 * Hook to monitor overall Realtime Engine state (connection, queue, active channels).
 */
export function useRealtimeState(): RealtimeState {
  const [state, setState] = useState<RealtimeState>(() => zolanzoRealtime.getState());

  useEffect(() => {
    const unsubscribe = zolanzoRealtime.subscribeState(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
