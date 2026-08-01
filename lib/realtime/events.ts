import { RealtimeEventType, RealtimeChannel, RealtimeEventPayload } from "./types";

export const EVENT_CHANNEL_MAP: Record<RealtimeEventType, RealtimeChannel> = {
  APPLICATION_CREATED: "applications",
  APPLICATION_UPDATED: "applications",
  APPLICATION_APPROVED: "applications",
  APPLICATION_REJECTED: "applications",
  APPLICATION_REVISION_REQUESTED: "applications",
  OPPORTUNITY_PUBLISHED: "opportunities",
  OPPORTUNITY_PAUSED: "opportunities",
  OPPORTUNITY_CLOSED: "opportunities",
  WALLET_UPDATED: "wallet",
  WITHDRAWAL_REQUESTED: "wallet",
  WITHDRAWAL_COMPLETED: "wallet",
  ESCROW_LOCKED: "wallet",
  ESCROW_RELEASED: "wallet",
  NOTIFICATION_CREATED: "notifications",
  NOTIFICATION_READ: "notifications",
  ACTIVITY_CREATED: "activity",
  PROFILE_UPDATED: "global",
  VERIFICATION_COMPLETED: "global",
  REFERRAL_EARNED: "wallet",
  CAMPAIGN_UPDATED: "hire",
  ADMIN_BROADCAST: "admin",
  USER_SUSPENDED: "admin",
  USER_RESTORED: "admin",
};

export function createRealtimeEvent<T = Record<string, unknown>>(
  type: RealtimeEventType,
  data: T,
  options?: {
    channel?: RealtimeChannel;
    isOptimistic?: boolean;
    source?: "client" | "server" | "mock" | "supabase";
  }
): RealtimeEventPayload<T> {
  const channel = options?.channel || EVENT_CHANNEL_MAP[type] || "global";
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    channel,
    timestamp: new Date().toISOString(),
    data,
    source: options?.source || "mock",
    isOptimistic: options?.isOptimistic ?? false,
  };
}
