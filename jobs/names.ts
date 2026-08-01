/**
 * Scheduled / queued job definitions.
 * Handlers live in workers/ when Phase 2 implements.
 */

export const JOB_NAMES = {
  // Media
  CONVERT_UPLOAD_WEBP: "images.convert-upload-webp",
  PROCESS_VIDEO: "media.process-video",
  PROCESS_AUDIO: "media.process-audio",
  SCAN_UPLOAD_VIRUS: "storage.virus-scan",
  // Comms
  SEND_TRANSACTIONAL_EMAIL: "email.send-transactional",
  SEND_SMS: "sms.send",
  SEND_PUSH: "push.send",
  NOTIFICATION_DIGEST: "notifications.digest",
  NOTIFICATION_RETRY: "notifications.retry",
  DISPATCH_NOTIFICATION: "notifications.dispatch",
  DELIVER_WEBHOOK: "webhooks.deliver",
  // Work engine
  GENERATE_CAMPAIGN_TASKS: "campaigns.generate-tasks",
  INDEX_MARKETPLACE_TASK: "marketplace.index-task",
  RUN_VALIDATION: "validation.run",
  RUN_VERIFICATION: "verification.run",
  RUN_AI_VALIDATION: "validation.ai",
  ASSIGNMENT_EXPIRE: "assignments.expire",
  RESERVATION_CLEANUP: "reservations.cleanup",
  // Finance
  RELEASE_ESCROW: "escrow.release",
  PROCESS_WITHDRAWAL: "withdrawals.process",
  SETTLEMENT_BATCH: "settlements.process-batch",
  REFERRAL_PAYOUT: "referrals.payout",
  RECONCILE_DAILY: "finance.reconcile-daily",
  RECONCILE_PAYSTACK: "payments.reconcile-paystack",
  // Analytics / search / cleanup
  PROJECT_ANALYTICS: "analytics.project-snapshot",
  GENERATE_REPORT: "reports.generate",
  REINDEX_SEARCH: "search.reindex",
  FANOUT_DOMAIN_EVENT: "events.fanout",
  CLEANUP_TEMP_UPLOADS: "storage.cleanup-temp",
  CLEANUP_EXPIRED_SESSIONS: "auth.cleanup-sessions",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

export const JOB_QUEUES = [
  "default",
  "critical",
  "comms",
  "media",
  "finance",
  "ai",
  "search",
  "cleanup",
] as const;

export type JobQueueName = (typeof JOB_QUEUES)[number];

export const JOB_QUEUE_ROUTING: Record<JobName, JobQueueName> = {
  "images.convert-upload-webp": "media",
  "media.process-video": "media",
  "media.process-audio": "media",
  "storage.virus-scan": "media",
  "email.send-transactional": "comms",
  "sms.send": "comms",
  "push.send": "comms",
  "notifications.digest": "comms",
  "notifications.retry": "comms",
  "notifications.dispatch": "comms",
  "webhooks.deliver": "comms",
  "campaigns.generate-tasks": "default",
  "marketplace.index-task": "search",
  "validation.run": "default",
  "verification.run": "default",
  "validation.ai": "ai",
  "assignments.expire": "default",
  "reservations.cleanup": "default",
  "escrow.release": "finance",
  "withdrawals.process": "finance",
  "settlements.process-batch": "finance",
  "referrals.payout": "finance",
  "finance.reconcile-daily": "finance",
  "payments.reconcile-paystack": "finance",
  "analytics.project-snapshot": "default",
  "reports.generate": "default",
  "search.reindex": "search",
  "events.fanout": "critical",
  "storage.cleanup-temp": "cleanup",
  "auth.cleanup-sessions": "cleanup",
};
