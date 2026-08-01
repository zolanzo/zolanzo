/**
 * Critical + maintenance job handlers.
 * Orchestration only — call existing domain services; no domain model changes.
 */

import "server-only";

import { prisma } from "@/lib/prisma/client";
import { createLogger } from "@/lib/observability/logger";
import { canTransitionAssignment } from "@/features/assignments/services/lifecycle";
import { assignmentRepository } from "@/features/assignments/repositories";
import type { AssignmentStatus } from "@/constants/work-states";
import { expireReservations } from "@/features/task-marketplace/services/reservation-engine";
import { processSettlement } from "@/features/settlements/services/settlement-service";
import { processWithdrawal } from "@/features/withdrawals/services/withdrawal-service";
import { dispatchNotificationJob } from "@/features/notifications/services/notification-hub";
import { projectWallet } from "@/features/wallet/services/projection";
import { reconcilePaystackPayments } from "@/features/payments/services/reconciliation";
import { JOB_NAMES, type JobName } from "@/jobs/names";
import { registerJob } from "@/jobs/runner/registry";
import type { JobHandler, JobResult } from "@/jobs/runner/types";
import type { RetryPolicyName } from "@/lib/reliability/retry";

const log = createLogger("jobs.handlers");

const ACTIVE_ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  "reserved",
  "assigned",
  "claimed",
  "started",
  "paused",
  "in_progress",
  "ready_for_submission",
  "revision_requested",
];

export const expireAssignmentsHandler: JobHandler = async () => {
  const now = new Date();
  const rows = await prisma.assignment.findMany({
    where: {
      status: { in: ACTIVE_ASSIGNMENT_STATUSES },
      expiresAt: { lte: now },
    },
    take: 200,
    select: { id: true, status: true, publicId: true },
  });

  let processed = 0;
  let failed = 0;
  for (const row of rows) {
    const from = row.status as AssignmentStatus;
    if (!canTransitionAssignment(from, "expired")) {
      continue;
    }
    try {
      await assignmentRepository.updateStatus({
        id: row.id,
        status: "expired",
        completedAt: now,
      });
      processed += 1;
    } catch (error) {
      failed += 1;
      log.warn("Failed to expire assignment", {
        assignmentPublicId: row.publicId,
        err:
          error instanceof Error
            ? { message: error.message }
            : { message: String(error) },
      });
    }
  }

  return {
    ok: failed === 0,
    summary: "assignments.expire",
    processed,
    failed,
  };
};

export const cleanupReservationsHandler: JobHandler = async () => {
  const { expired } = await expireReservations();
  return {
    ok: true,
    summary: "reservations.cleanup",
    processed: expired,
    failed: 0,
  };
};

export const processSettlementsHandler: JobHandler = async () => {
  const now = new Date();
  const due = await prisma.settlement.findMany({
    where: {
      status: { in: ["pending", "scheduled"] },
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    take: 100,
    orderBy: { createdAt: "asc" },
    select: { publicId: true },
  });

  let processed = 0;
  let failed = 0;
  for (const row of due) {
    const result = await processSettlement({
      input: { settlementPublicId: row.publicId },
    });
    if (result.ok) processed += 1;
    else failed += 1;
  }

  return {
    ok: failed === 0,
    summary: "settlements.process-batch",
    processed,
    failed,
  };
};

export const reconcileFinanceHandler: JobHandler = async () => {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const walletIds = await prisma.ledgerEntry.findMany({
    where: {
      walletId: { not: null },
      createdAt: { gte: since },
    },
    distinct: ["walletId"],
    take: 500,
    select: { walletId: true },
  });

  let processed = 0;
  let failed = 0;
  for (const row of walletIds) {
    if (!row.walletId) continue;
    try {
      await projectWallet(row.walletId);
      processed += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    ok: failed === 0,
    summary: "finance.reconcile-daily",
    processed,
    failed,
  };
};

export const reconcilePaystackHandler: JobHandler = async () => {
  const report = await reconcilePaystackPayments({ windowHours: 24 });
  return {
    ok: report.mismatches.length === 0,
    summary: "payments.reconcile-paystack",
    processed: report.matched,
    failed: report.mismatches.length,
    metadata: {
      providerCount: report.providerCount,
      internalCount: report.internalCount,
      mode: report.mode,
    },
  };
};

export const retryNotificationsHandler: JobHandler = async () => {
  const now = new Date();
  const jobs = await prisma.notificationJob.findMany({
    where: {
      status: { in: ["scheduled", "queued"] },
      scheduledAt: { lte: now },
    },
    take: 100,
    orderBy: { scheduledAt: "asc" },
    select: { id: true },
  });

  let processed = 0;
  let failed = 0;
  for (const job of jobs) {
    const result = await dispatchNotificationJob({
      input: { jobId: job.id, preferLive: true },
    });
    if (result.ok) processed += 1;
    else failed += 1;
  }

  return {
    ok: true,
    summary: "notifications.retry",
    processed,
    failed,
  };
};

export const processWithdrawalsHandler: JobHandler = async () => {
  const now = new Date();
  const rows = await prisma.withdrawalRequest.findMany({
    where: {
      status: { in: ["approved", "scheduled"] },
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    take: 50,
    orderBy: { createdAt: "asc" },
    select: { publicId: true },
  });

  let processed = 0;
  let failed = 0;
  for (const row of rows) {
    const result = await processWithdrawal({
      input: { withdrawalPublicId: row.publicId },
    });
    if (result.ok) processed += 1;
    else failed += 1;
  }

  return {
    ok: failed === 0,
    summary: "withdrawals.process",
    processed,
    failed,
  };
};

function maintenanceHandler(
  name: JobName,
  summary: string,
): JobHandler {
  return async () => {
    log.info("Maintenance job placeholder executed", { jobName: name });
    const result: JobResult = {
      ok: true,
      summary,
      processed: 0,
      skipped: true,
      metadata: { placeholder: true },
    };
    return result;
  };
}

export const projectAnalyticsHandler: JobHandler = async () => {
  const { setAnalyticsBackend } = await import("@/lib/analytics/analytics-service");
  setAnalyticsBackend("prisma");
  const { rollup, snapshot } = await import("@/lib/analytics/analytics-service");
  const rollupResult = await rollup({ period: "daily" });
  const snap = await snapshot({ period: "daily" });

  let scheduleRuns = 0;
  try {
    const { executeDueSchedules } = await import("@/lib/analytics/reports");
    const runs = await executeDueSchedules();
    scheduleRuns = runs.filter((r) => r.ok).length;
  } catch {
    /* reports optional */
  }

  let automationRetries = 0;
  try {
    const { runAutomationScheduler } = await import("@/lib/automation");
    const result = await runAutomationScheduler();
    automationRetries = result.retried;
  } catch {
    /* automation optional */
  }

  return {
    ok: true,
    summary: "analytics.project-snapshot",
    processed:
      rollupResult.metricsWritten +
      (snap ? 1 : 0) +
      scheduleRuns +
      automationRetries,
    failed: 0,
    metadata: {
      metricsWritten: rollupResult.metricsWritten,
      rollupMs: rollupResult.durationMs,
      snapshotPublicId: snap?.publicId ?? null,
      snapshotDurationMs: snap?.durationMs ?? null,
      reportScheduleRuns: scheduleRuns,
      automationRetries,
    },
  };
};

const CATALOG: Array<{
  name: JobName;
  handler: JobHandler;
  retryPolicy: RetryPolicyName;
  description: string;
}> = [
  {
    name: JOB_NAMES.ASSIGNMENT_EXPIRE,
    handler: expireAssignmentsHandler,
    retryPolicy: "exponential",
    description: "Expire overdue assignments",
  },
  {
    name: JOB_NAMES.RESERVATION_CLEANUP,
    handler: cleanupReservationsHandler,
    retryPolicy: "exponential",
    description: "Expire pending marketplace reservations",
  },
  {
    name: JOB_NAMES.SETTLEMENT_BATCH,
    handler: processSettlementsHandler,
    retryPolicy: "finance",
    description: "Process due settlements",
  },
  {
    name: JOB_NAMES.RECONCILE_DAILY,
    handler: reconcileFinanceHandler,
    retryPolicy: "finance",
    description: "Rebuild wallet projections from ledger",
  },
  {
    name: JOB_NAMES.RECONCILE_PAYSTACK,
    handler: reconcilePaystackHandler,
    retryPolicy: "finance",
    description: "Reconcile Paystack transactions vs internal ledger",
  },
  {
    name: JOB_NAMES.NOTIFICATION_RETRY,
    handler: retryNotificationsHandler,
    retryPolicy: "notifications",
    description: "Dispatch due / retryable notification jobs",
  },
  {
    name: JOB_NAMES.PROCESS_WITHDRAWAL,
    handler: processWithdrawalsHandler,
    retryPolicy: "finance",
    description: "Process approved / scheduled withdrawals",
  },
  {
    name: JOB_NAMES.NOTIFICATION_DIGEST,
    handler: maintenanceHandler(
      JOB_NAMES.NOTIFICATION_DIGEST,
      "notifications.digest",
    ),
    retryPolicy: "immediate",
    description: "Digest placeholder (domain wiring later)",
  },
  {
    name: JOB_NAMES.CLEANUP_TEMP_UPLOADS,
    handler: async () => {
      const { runStorageCleanup } = await import(
        "@/features/storage/services/cleanup"
      );
      const result = await runStorageCleanup();
      return {
        ok: result.failures === 0,
        summary: "storage.cleanup-temp",
        processed: result.deletedTemp + result.deletedTrash,
        failed: result.failures,
        metadata: result as unknown as Record<string, unknown>,
      };
    },
    retryPolicy: "immediate",
    description: "Temp upload + expired trash cleanup",
  },
  {
    name: JOB_NAMES.CLEANUP_EXPIRED_SESSIONS,
    handler: maintenanceHandler(
      JOB_NAMES.CLEANUP_EXPIRED_SESSIONS,
      "auth.cleanup-sessions",
    ),
    retryPolicy: "immediate",
    description: "Session cleanup placeholder",
  },
  {
    name: JOB_NAMES.PROJECT_ANALYTICS,
    handler: projectAnalyticsHandler,
    retryPolicy: "immediate",
    description: "Analytics daily rollup + snapshot",
  },
];

let registered = false;

export function registerAllJobHandlers(): void {
  if (registered) return;
  for (const job of CATALOG) {
    registerJob(job);
  }
  registered = true;
}

/** Test helper */
export function resetHandlerRegistration(): void {
  registered = false;
}
