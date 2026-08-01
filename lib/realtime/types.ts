export type RealtimeEventType =
  | "APPLICATION_CREATED"
  | "APPLICATION_UPDATED"
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED"
  | "APPLICATION_REVISION_REQUESTED"
  | "OPPORTUNITY_PUBLISHED"
  | "OPPORTUNITY_PAUSED"
  | "OPPORTUNITY_CLOSED"
  | "WALLET_UPDATED"
  | "WITHDRAWAL_REQUESTED"
  | "WITHDRAWAL_COMPLETED"
  | "ESCROW_LOCKED"
  | "ESCROW_RELEASED"
  | "NOTIFICATION_CREATED"
  | "NOTIFICATION_READ"
  | "ACTIVITY_CREATED"
  | "PROFILE_UPDATED"
  | "VERIFICATION_COMPLETED"
  | "REFERRAL_EARNED"
  | "CAMPAIGN_UPDATED"
  | "ADMIN_BROADCAST"
  | "USER_SUSPENDED"
  | "USER_RESTORED";

export type RealtimeChannel =
  | "global"
  | "wallet"
  | "applications"
  | "opportunities"
  | "notifications"
  | "activity"
  | "admin"
  | "hire";

export interface RealtimeEventPayload<T = Record<string, unknown>> {
  id: string;
  type: RealtimeEventType;
  channel: RealtimeChannel;
  timestamp: string;
  data: T;
  source?: "client" | "server" | "mock" | "supabase";
  isOptimistic?: boolean;
}

export type SubscriptionCallback<T = Record<string, unknown>> = (
  event: RealtimeEventPayload<T>
) => void;

export interface RealtimeState {
  isConnected: boolean;
  activeChannels: RealtimeChannel[];
  eventCount: number;
  lastEvent: RealtimeEventPayload | null;
  queuedCount: number;
}

export interface QueuedEvent {
  event: RealtimeEventPayload;
  retryCount: number;
  createdTime: number;
}
