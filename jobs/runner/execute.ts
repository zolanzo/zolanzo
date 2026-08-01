/**
 * Execute a registered job with correlation, locking, retry, and structured logs.
 */

import { generateCorrelationId } from "@/lib/observability/correlation";
import { createLogger } from "@/lib/observability/logger";
import { runJobWithContext } from "@/jobs/correlation";
import { withRetry, type RetryPolicyName } from "@/lib/reliability/retry";
import { withSchedulerLock } from "@/lib/reliability/scheduler-lock";
import { getRegisteredJob } from "@/jobs/runner/registry";
import type { JobName } from "@/jobs/names";
import type { JobResult } from "@/jobs/runner/types";
import { metrics } from "@/lib/observability/metrics";
import { withSpan } from "@/lib/observability/trace";
import { captureException } from "@/lib/integrations/monitoring";

const log = createLogger("jobs.execute");

export type ExecuteJobOptions = {
  jobName: JobName;
  schedule?: string;
  correlationId?: string | null;
  originalCorrelationId?: string | null;
  isRetry?: boolean;
  /** Skip scheduler lock (tests) */
  skipLock?: boolean;
  /** Override sleep for tests */
  sleep?: (ms: number) => Promise<void>;
};

export type ExecuteJobReport = {
  jobId: string;
  jobName: JobName;
  schedule?: string;
  correlationId: string;
  durationMs: number;
  result: JobResult | null;
  retryCount: number;
  skippedDuplicate: boolean;
  error?: string;
};

export async function executeRegisteredJob(
  opts: ExecuteJobOptions,
): Promise<ExecuteJobReport> {
  const registered = getRegisteredJob(opts.jobName);
  const jobId = generateCorrelationId();
  const correlationId =
    opts.originalCorrelationId ??
    opts.correlationId ??
    generateCorrelationId();
  const started = Date.now();

  if (!registered) {
    const report: ExecuteJobReport = {
      jobId,
      jobName: opts.jobName,
      schedule: opts.schedule,
      correlationId,
      durationMs: Date.now() - started,
      result: null,
      retryCount: 0,
      skippedDuplicate: false,
      error: "handler_not_registered",
    };
    log.error("Job handler not registered", {
      jobId,
      jobName: opts.jobName,
      schedule: opts.schedule,
    });
    return report;
  }

  const run = async (): Promise<ExecuteJobReport> =>
    runJobWithContext(
      {
        jobName: opts.jobName,
        correlationId,
        originalCorrelationId: opts.originalCorrelationId ?? correlationId,
        isRetry: opts.isRetry,
        operation: opts.jobName,
      },
      async () => {
        return withSpan(
          "job.execute",
          { job: opts.jobName, jobId },
          async () => {
            log.info("Job starting", {
              jobId,
              jobName: opts.jobName,
              schedule: opts.schedule,
              retryPolicy: registered.retryPolicy,
              outcome: "started",
            });

            const outcome = await withRetry(
              registered.retryPolicy as RetryPolicyName,
              async (attempt) =>
                registered.handler({
                  jobName: opts.jobName,
                  schedule: opts.schedule,
                  attempt,
                }),
              { sleep: opts.sleep },
            );

            const durationMs = Date.now() - started;
            if (outcome.ok) {
              const retries = Math.max(0, outcome.attempts - 1);
              metrics.job({
                jobName: opts.jobName,
                durationMs,
                ok: true,
                retries,
              });
              log.info("Job completed", {
                jobId,
                jobName: opts.jobName,
                schedule: opts.schedule,
                durationMs,
                result: outcome.value.ok ? "ok" : "soft_fail",
                summary: outcome.value.summary,
                processed: outcome.value.processed,
                failed: outcome.value.failed,
                retryCount: retries,
                outcome: "ok",
              });
              return {
                jobId,
                jobName: opts.jobName,
                schedule: opts.schedule,
                correlationId,
                durationMs,
                result: outcome.value,
                retryCount: retries,
                skippedDuplicate: false,
              };
            }

            const message =
              outcome.error instanceof Error
                ? outcome.error.message
                : String(outcome.error);
            const retries = Math.max(0, outcome.attempts - 1);
            metrics.job({
              jobName: opts.jobName,
              durationMs,
              ok: false,
              retries,
            });
            log.error("Job failed", {
              jobId,
              jobName: opts.jobName,
              schedule: opts.schedule,
              durationMs,
              retryCount: retries,
              deadLetterReady: outcome.deadLetterReady,
              err: { message },
              outcome: "error",
              errorCode: "JOB_FAILED",
            });
            void captureException(outcome.error, {
              message: `Job failed: ${opts.jobName}`,
              tags: { jobName: opts.jobName },
              extras: { jobId, retries },
            });
            return {
              jobId,
              jobName: opts.jobName,
              schedule: opts.schedule,
              correlationId,
              durationMs,
              result: null,
              retryCount: retries,
              skippedDuplicate: false,
              error: message,
            };
          },
        );
      },
    );

  if (opts.skipLock) {
    return run();
  }

  const locked = await withSchedulerLock(opts.jobName, run);
  if (!locked.ran) {
    log.info("Job skipped — lock held", {
      jobId,
      jobName: opts.jobName,
      schedule: opts.schedule,
      lockMode: locked.mode,
    });
    return {
      jobId,
      jobName: opts.jobName,
      schedule: opts.schedule,
      correlationId,
      durationMs: Date.now() - started,
      result: { ok: true, skipped: true, summary: "lock_not_acquired" },
      retryCount: 0,
      skippedDuplicate: true,
    };
  }

  return locked.result!;
}
