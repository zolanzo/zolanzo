/**
 * Domain events — event-driven backbone for ZOLANZO.
 * Producers emit; workers/jobs/notifications subscribe.
 * Architecture only — no handlers in Step 4.
 */

export const DOMAIN_EVENTS = [
  // Auth / identity
  "user.created",
  "user.registered",
  "user.verified",
  "user.updated",
  "user.suspended",
  "user.deleted",
  "identity.verified",
  "email.verified",
  "phone.verified",
  "session.created",
  "session.revoked",
  "device.trusted",
  "device.revoked",
  "mfa.enabled",
  "mfa.disabled",
  "login.succeeded",
  "login.failed",
  "password.reset_requested",
  "password.updated",
  "risk.signal_raised",
  // Tenancy
  "organization.created",
  "organization.updated",
  "organization.suspended",
  "organization.switched",
  "member.invited",
  "member.accepted",
  "member.role_changed",
  "member.removed",
  "team.created",
  "team.member_added",
  "team.member_removed",
  "workspace.created",
  "workspace.archived",
  "audit.recorded",
  // Supply / demand profiles
  "worker.profile_completed",
  "client.profile_completed",
  /** @deprecated Use client.profile_completed */
  "advertiser.profile_completed",
  "developer.profile_completed",
  // Campaign / task lifecycle (Work Engine kernel)
  "campaign.created",
  "campaign.updated",
  "campaign.funded",
  "campaign.published",
  "campaign.paused",
  "campaign.completed",
  "campaign.archived",
  "task_template.registered",
  "task.generated",
  "task.created",
  "task.opened",
  "task.claimed",
  "task.expired",
  "task.cancelled",
  // Marketplace funnel
  "application.submitted",
  "application.accepted",
  "application.rejected",
  "assignment.claimed",
  "assignment.created",
  "assignment.started",
  "assignment.submitted",
  "assignment.completed",
  "assignment.cancelled",
  "assignment.expired",
  // Delivery / validation / review
  "submission.created",
  "submission.updated",
  "submission.submitted",
  "validation.started",
  "validation.completed",
  "validation.failed",
  "review.pending",
  "review.approved",
  "review.rejected",
  "review.revision_requested",
  "review.escalated",
  "submission.approved",
  "submission.rejected",
  "submission.revision_requested",
  "verification.started",
  "verification.passed",
  "verification.failed",
  "work.completed",
  // Money / ledger
  "wallet.created",
  "wallet.credited",
  "wallet.debited",
  "wallet.frozen",
  "wallet.released",
  "ledger.journal.created",
  "ledger.journal.posted",
  "ledger.journal.reversed",
  "ledger.entry.created",
  "transaction.created",
  "transaction.completed",
  "transaction.failed",
  "transaction.reversed",
  "payment.initiated",
  "payment.succeeded",
  "payment.failed",
  "payment.refunded",
  "payment_method.verified",
  "escrow.reserved",
  "escrow.funded",
  "escrow.held",
  "escrow.released",
  "escrow.refunded",
  "escrow.expired",
  "escrow.partially_released",
  "withdrawal.requested",
  "withdrawal.approved",
  "withdrawal.processing",
  "withdrawal.completed",
  "withdrawal.failed",
  "withdrawal.returned",
  "refund.requested",
  "refund.processed",
  "refund.failed",
  "adjustment.created",
  "settlement.batch_opened",
  "settlement.batch_settled",
  "settlement.item_failed",
  "reconciliation.completed",
  "reward.granted",
  "bonus.granted",
  "referral.converted",
  "referral.commission_paid",
  // Analytics
  "analytics.work_unit_completed",
  "analytics.snapshot_ready",
  // Comms
  "notification.queued",
  "notification.sent",
  "notification.failed",
  "message.sent",
  "message.read",
  // AI verticals
  "ai_job.created",
  "ai_job.completed",
  "ai_dataset.ingested",
  "ai_label.submitted",
  "ai_label.accepted",
  // Trust & safety
  "trust.score_updated",
  "badge.granted",
  "badge.revoked",
  "report.created",
  "moderation.action_taken",
  "kyc.submitted",
  "kyc.approved",
  "kyc.rejected",
  "dispute.opened",
  "dispute.resolved",
  // Platform
  "feature_flag.changed",
  "api.key_created",
  "api.key_revoked",
  "support.ticket_created",
  "support.ticket_resolved",
] as const;

export type DomainEventName = (typeof DOMAIN_EVENTS)[number];

export type DomainEvent<TPayload = Record<string, unknown>> = {
  id: string;
  name: DomainEventName;
  occurredAt: string;
  actorId?: string;
  organizationId?: string;
  correlationId?: string;
  causationId?: string;
  payload: TPayload;
};

export type UserCreatedPayload = {
  userId: string;
  accountType: string;
};

export type OrganizationCreatedPayload = {
  organizationId: string;
  ownerUserId: string;
  name: string;
};

export type MemberInvitedPayload = {
  organizationId: string;
  membershipId: string;
  email: string;
  role: string;
  invitedBy: string;
};

export type MemberAcceptedPayload = {
  organizationId: string;
  membershipId: string;
  userId: string;
  role: string;
};

export type IdentityVerifiedPayload = {
  userId: string;
  level: string;
  method: string;
};

export type DeviceTrustedPayload = {
  userId: string;
  deviceId: string;
};

export type SessionRevokedPayload = {
  userId: string;
  sessionId: string;
  reason: string;
};

export type CampaignCreatedPayload = {
  campaignId: string;
  organizationId: string;
  typeId: string;
};

export type TaskClaimedPayload = {
  taskId: string;
  campaignId: string;
  workerId: string;
  assignmentId: string;
};

export type SubmissionApprovedPayload = {
  submissionId: string;
  assignmentId: string;
  workerId: string;
  amountMinor?: number;
  currency?: string;
};

export type WalletCreditedPayload = {
  walletId: string;
  userId: string;
  amountMinor: number;
  currency: string;
  reason: string;
};

export type WithdrawalCompletedPayload = {
  withdrawalId: string;
  userId: string;
  amountMinor: number;
  currency: string;
};

export type NotificationSentPayload = {
  notificationId: string;
  userId: string;
  channel: "email" | "push" | "in_app" | "sms";
};
