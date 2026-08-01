/**
 * Cron / schedule definitions — registered by the reliability cron runner.
 */

import type { JobName } from "@/jobs/names";

export type CronSchedule = {
  job: JobName;
  /** Standard 5-field cron in UTC */
  cron: string;
  description: string;
};

export const CRON_SCHEDULES: readonly CronSchedule[] = [
  {
    job: "finance.reconcile-daily",
    cron: "0 2 * * *",
    description: "Daily financial reconciliation",
  },
  {
    job: "payments.reconcile-paystack",
    cron: "30 2 * * *",
    description: "Nightly Paystack ↔ ledger reconciliation",
  },
  {
    job: "notifications.digest",
    cron: "0 8 * * *",
    description: "Morning notification digests",
  },
  {
    job: "assignments.expire",
    cron: "*/5 * * * *",
    description: "Expire overdue assignments",
  },
  {
    job: "reservations.cleanup",
    cron: "*/5 * * * *",
    description: "Expire pending marketplace reservations",
  },
  {
    job: "notifications.retry",
    cron: "*/2 * * * *",
    description: "Dispatch due / retryable notification jobs",
  },
  {
    job: "withdrawals.process",
    cron: "*/15 * * * *",
    description: "Process approved / scheduled withdrawals",
  },
  {
    job: "storage.cleanup-temp",
    cron: "15 * * * *",
    description: "Cleanup temporary uploads",
  },
  {
    job: "auth.cleanup-sessions",
    cron: "30 3 * * *",
    description: "Purge expired sessions",
  },
  {
    job: "analytics.project-snapshot",
    cron: "0 * * * *",
    description: "Hourly analytics projections",
  },
  {
    job: "settlements.process-batch",
    cron: "0 10,16 * * 1-5",
    description: "Weekday settlement batches",
  },
] as const;
