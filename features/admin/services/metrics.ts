/**
 * Collect operational metrics from domain tables (read-only aggregation).
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  emptyMetrics,
  type OperationalMetrics,
} from "@/features/admin/services/operational-views";

function startOfUtcDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/** Reviews pending longer than 24h count as aged for SLA. */
const REVIEW_SLA_MS = 24 * 60 * 60_000;

export async function collectOperationalMetrics(): Promise<OperationalMetrics> {
  const metrics = emptyMetrics();
  const today = startOfUtcDay();
  const agedBefore = new Date(Date.now() - REVIEW_SLA_MS);

  const [
    activeCampaigns,
    pausedCampaigns,
    draftCampaigns,
    archivedCampaigns,
    availableWork,
    reservedTasks,
    activeAssignments,
    pendingReviews,
    inReview,
    escalatedReviews,
    agedReviews,
    pendingSettlements,
    processingSettlements,
    failedSettlements,
    pendingWithdrawals,
    processingWithdrawals,
    failedWithdrawals,
    scheduledNotifications,
    failedNotifications,
    deliveredNotificationsToday,
    awaitingPayments,
    failedPayments,
    succeededPaymentsToday,
    activeUsers,
    suspendedUsers,
    commandsToday,
    auditsToday,
    recentCommandFailures,
  ] = await Promise.all([
    prisma.campaign.count({ where: { status: "active" } }),
    prisma.campaign.count({ where: { status: "paused" } }),
    prisma.campaign.count({ where: { status: "draft" } }),
    prisma.campaign.count({ where: { status: "archived" } }),
    prisma.taskInstance.count({
      where: { status: "available" },
    }),
    prisma.reservation.count({ where: { status: "pending" } }),
    prisma.assignment.count({
      where: {
        status: {
          in: ["assigned", "claimed", "started", "in_progress", "paused"],
        },
      },
    }),
    prisma.reviewQueueItem.count({ where: { status: "pending" } }),
    prisma.reviewQueueItem.count({ where: { status: "in_review" } }),
    prisma.reviewQueueItem.count({ where: { status: "escalated" } }),
    prisma.reviewQueueItem.count({
      where: {
        status: { in: ["pending", "in_review"] },
        createdAt: { lt: agedBefore },
      },
    }),
    prisma.settlement.count({
      where: { status: { in: ["pending", "scheduled"] } },
    }),
    prisma.settlement.count({ where: { status: "processing" } }),
    prisma.settlement.count({ where: { status: "failed" } }),
    prisma.withdrawalRequest.count({
      where: { status: { in: ["pending", "pending_approval"] } },
    }),
    prisma.withdrawalRequest.count({
      where: { status: { in: ["approved", "scheduled", "processing"] } },
    }),
    prisma.withdrawalRequest.count({ where: { status: "failed" } }),
    prisma.notificationJob.count({
      where: { status: { in: ["scheduled", "queued"] } },
    }),
    prisma.notificationJob.count({ where: { status: "failed" } }),
    prisma.notificationJob.count({
      where: { status: "delivered", deliveredAt: { gte: today } },
    }),
    prisma.paymentIntent.count({
      where: { status: { in: ["awaiting_payment", "pending_provider"] } },
    }),
    prisma.paymentIntent.count({ where: { status: "failed" } }),
    prisma.paymentIntent.count({
      where: { status: "succeeded", completedAt: { gte: today } },
    }),
    prisma.user.count({ where: { status: "active" } }),
    prisma.user.count({ where: { status: "suspended" } }),
    prisma.operationalCommand.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.operationalAudit.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.operationalCommand.count({
      where: { status: "failed", createdAt: { gte: today } },
    }),
  ]);

  metrics.activeCampaigns = activeCampaigns;
  metrics.pausedCampaigns = pausedCampaigns;
  metrics.draftCampaigns = draftCampaigns;
  metrics.archivedCampaigns = archivedCampaigns;
  metrics.availableWork = availableWork;
  metrics.reservedTasks = reservedTasks;
  metrics.activeAssignments = activeAssignments;
  metrics.pendingReviews = pendingReviews;
  metrics.inReview = inReview;
  metrics.escalatedReviews = escalatedReviews;
  metrics.agedReviews = agedReviews;
  metrics.pendingSettlements = pendingSettlements;
  metrics.processingSettlements = processingSettlements;
  metrics.failedSettlements = failedSettlements;
  metrics.pendingWithdrawals = pendingWithdrawals;
  metrics.processingWithdrawals = processingWithdrawals;
  metrics.failedWithdrawals = failedWithdrawals;
  metrics.scheduledNotifications = scheduledNotifications;
  metrics.failedNotifications = failedNotifications;
  metrics.deliveredNotificationsToday = deliveredNotificationsToday;
  metrics.awaitingPayments = awaitingPayments;
  metrics.failedPayments = failedPayments;
  metrics.succeededPaymentsToday = succeededPaymentsToday;
  metrics.activeUsers = activeUsers;
  metrics.suspendedUsers = suspendedUsers;
  metrics.openModeration = suspendedUsers; // proxy until moderation cases exist
  metrics.commandsToday = commandsToday;
  metrics.auditsToday = auditsToday;
  metrics.recentCommandFailures = recentCommandFailures;

  return metrics;
}
