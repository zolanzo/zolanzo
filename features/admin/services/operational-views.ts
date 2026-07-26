/**
 * Pure operational view builders — aggregate counts into ops DTOs.
 */

import type {
  OperationalQueueKey,
  OperationalViewKey,
  SlaSeverity,
} from "@/constants/operations";

export type QueueHealthItem = {
  queue: OperationalQueueKey;
  pending: number;
  failed: number;
  aged: number;
  sla: SlaSeverity;
};

export type PlatformOverviewView = {
  key: "platform_overview";
  activeCampaigns: number;
  availableWork: number;
  activeAssignments: number;
  pendingReviews: number;
  pendingSettlements: number;
  pendingWithdrawals: number;
  failedNotifications: number;
  failedPayments: number;
  suspendedUsers: number;
};

export type CampaignOperationsView = {
  key: "campaign_operations";
  active: number;
  paused: number;
  draft: number;
  archived: number;
};

export type MarketplaceOperationsView = {
  key: "marketplace_operations";
  openTasks: number;
  reserved: number;
  claimedAssignments: number;
};

export type ReviewOperationsView = {
  key: "review_operations";
  pending: number;
  inReview: number;
  escalated: number;
  agedBeyondSla: number;
};

export type SettlementOperationsView = {
  key: "settlement_operations";
  pending: number;
  processing: number;
  failed: number;
};

export type WithdrawalOperationsView = {
  key: "withdrawal_operations";
  pendingApproval: number;
  processing: number;
  failed: number;
};

export type NotificationOperationsView = {
  key: "notification_operations";
  scheduled: number;
  failed: number;
  deliveredToday: number;
};

export type PaymentOperationsView = {
  key: "payment_operations";
  awaiting: number;
  failed: number;
  succeededToday: number;
};

export type UserTrustOverviewView = {
  key: "user_trust_overview";
  activeUsers: number;
  suspendedUsers: number;
  openModeration: number;
};

export type AuditOverviewView = {
  key: "audit_overview";
  commandsToday: number;
  auditsToday: number;
  recentFailures: number;
};

export type OperationalView =
  | PlatformOverviewView
  | CampaignOperationsView
  | MarketplaceOperationsView
  | ReviewOperationsView
  | SettlementOperationsView
  | WithdrawalOperationsView
  | NotificationOperationsView
  | PaymentOperationsView
  | UserTrustOverviewView
  | AuditOverviewView;

export type OperationalMetrics = {
  activeCampaigns: number;
  pausedCampaigns: number;
  draftCampaigns: number;
  archivedCampaigns: number;
  availableWork: number;
  reservedTasks: number;
  activeAssignments: number;
  pendingReviews: number;
  inReview: number;
  escalatedReviews: number;
  agedReviews: number;
  pendingSettlements: number;
  processingSettlements: number;
  failedSettlements: number;
  pendingWithdrawals: number;
  processingWithdrawals: number;
  failedWithdrawals: number;
  scheduledNotifications: number;
  failedNotifications: number;
  deliveredNotificationsToday: number;
  awaitingPayments: number;
  failedPayments: number;
  succeededPaymentsToday: number;
  activeUsers: number;
  suspendedUsers: number;
  openModeration: number;
  commandsToday: number;
  auditsToday: number;
  recentCommandFailures: number;
};

export function emptyMetrics(): OperationalMetrics {
  return {
    activeCampaigns: 0,
    pausedCampaigns: 0,
    draftCampaigns: 0,
    archivedCampaigns: 0,
    availableWork: 0,
    reservedTasks: 0,
    activeAssignments: 0,
    pendingReviews: 0,
    inReview: 0,
    escalatedReviews: 0,
    agedReviews: 0,
    pendingSettlements: 0,
    processingSettlements: 0,
    failedSettlements: 0,
    pendingWithdrawals: 0,
    processingWithdrawals: 0,
    failedWithdrawals: 0,
    scheduledNotifications: 0,
    failedNotifications: 0,
    deliveredNotificationsToday: 0,
    awaitingPayments: 0,
    failedPayments: 0,
    succeededPaymentsToday: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    openModeration: 0,
    commandsToday: 0,
    auditsToday: 0,
    recentCommandFailures: 0,
  };
}

export function slaForQueue(params: {
  pending: number;
  failed: number;
  aged: number;
}): SlaSeverity {
  if (params.failed > 0 || params.aged > 5) return "breach";
  if (params.aged > 0 || params.pending > 50) return "watch";
  return "ok";
}

export function buildQueueHealth(
  metrics: OperationalMetrics,
): QueueHealthItem[] {
  return [
    {
      queue: "review",
      pending: metrics.pendingReviews + metrics.inReview,
      failed: 0,
      aged: metrics.agedReviews,
      sla: slaForQueue({
        pending: metrics.pendingReviews,
        failed: 0,
        aged: metrics.agedReviews,
      }),
    },
    {
      queue: "settlement",
      pending: metrics.pendingSettlements + metrics.processingSettlements,
      failed: metrics.failedSettlements,
      aged: 0,
      sla: slaForQueue({
        pending: metrics.pendingSettlements,
        failed: metrics.failedSettlements,
        aged: 0,
      }),
    },
    {
      queue: "withdrawal",
      pending: metrics.pendingWithdrawals + metrics.processingWithdrawals,
      failed: metrics.failedWithdrawals,
      aged: 0,
      sla: slaForQueue({
        pending: metrics.pendingWithdrawals,
        failed: metrics.failedWithdrawals,
        aged: 0,
      }),
    },
    {
      queue: "notification",
      pending: metrics.scheduledNotifications,
      failed: metrics.failedNotifications,
      aged: 0,
      sla: slaForQueue({
        pending: metrics.scheduledNotifications,
        failed: metrics.failedNotifications,
        aged: 0,
      }),
    },
    {
      queue: "payment",
      pending: metrics.awaitingPayments,
      failed: metrics.failedPayments,
      aged: 0,
      sla: slaForQueue({
        pending: metrics.awaitingPayments,
        failed: metrics.failedPayments,
        aged: 0,
      }),
    },
    {
      queue: "moderation",
      pending: metrics.openModeration,
      failed: 0,
      aged: 0,
      sla: slaForQueue({
        pending: metrics.openModeration,
        failed: 0,
        aged: 0,
      }),
    },
  ];
}

export function buildOperationalView(
  key: OperationalViewKey,
  metrics: OperationalMetrics,
): OperationalView {
  switch (key) {
    case "platform_overview":
      return {
        key,
        activeCampaigns: metrics.activeCampaigns,
        availableWork: metrics.availableWork,
        activeAssignments: metrics.activeAssignments,
        pendingReviews: metrics.pendingReviews,
        pendingSettlements: metrics.pendingSettlements,
        pendingWithdrawals: metrics.pendingWithdrawals,
        failedNotifications: metrics.failedNotifications,
        failedPayments: metrics.failedPayments,
        suspendedUsers: metrics.suspendedUsers,
      };
    case "campaign_operations":
      return {
        key,
        active: metrics.activeCampaigns,
        paused: metrics.pausedCampaigns,
        draft: metrics.draftCampaigns,
        archived: metrics.archivedCampaigns,
      };
    case "marketplace_operations":
      return {
        key,
        openTasks: metrics.availableWork,
        reserved: metrics.reservedTasks,
        claimedAssignments: metrics.activeAssignments,
      };
    case "review_operations":
      return {
        key,
        pending: metrics.pendingReviews,
        inReview: metrics.inReview,
        escalated: metrics.escalatedReviews,
        agedBeyondSla: metrics.agedReviews,
      };
    case "settlement_operations":
      return {
        key,
        pending: metrics.pendingSettlements,
        processing: metrics.processingSettlements,
        failed: metrics.failedSettlements,
      };
    case "withdrawal_operations":
      return {
        key,
        pendingApproval: metrics.pendingWithdrawals,
        processing: metrics.processingWithdrawals,
        failed: metrics.failedWithdrawals,
      };
    case "notification_operations":
      return {
        key,
        scheduled: metrics.scheduledNotifications,
        failed: metrics.failedNotifications,
        deliveredToday: metrics.deliveredNotificationsToday,
      };
    case "payment_operations":
      return {
        key,
        awaiting: metrics.awaitingPayments,
        failed: metrics.failedPayments,
        succeededToday: metrics.succeededPaymentsToday,
      };
    case "user_trust_overview":
      return {
        key,
        activeUsers: metrics.activeUsers,
        suspendedUsers: metrics.suspendedUsers,
        openModeration: metrics.openModeration,
      };
    case "audit_overview":
      return {
        key,
        commandsToday: metrics.commandsToday,
        auditsToday: metrics.auditsToday,
        recentFailures: metrics.recentCommandFailures,
      };
  }
}

export function buildAllViews(
  metrics: OperationalMetrics,
): Record<OperationalViewKey, OperationalView> {
  const keys: OperationalViewKey[] = [
    "platform_overview",
    "campaign_operations",
    "marketplace_operations",
    "review_operations",
    "settlement_operations",
    "withdrawal_operations",
    "notification_operations",
    "payment_operations",
    "user_trust_overview",
    "audit_overview",
  ];
  const out = {} as Record<OperationalViewKey, OperationalView>;
  for (const key of keys) {
    out[key] = buildOperationalView(key, metrics);
  }
  return out;
}
