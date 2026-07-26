/**
 * Job runner types — reliability orchestration only.
 */

import type { JobName } from "@/jobs/names";
import type { RetryPolicyName } from "@/lib/reliability/retry";

export type JobResult = {
  ok: boolean;
  summary?: string;
  processed?: number;
  failed?: number;
  skipped?: boolean;
  metadata?: Record<string, unknown>;
};

export type JobHandler = (ctx: {
  jobName: JobName;
  schedule?: string;
  attempt: number;
}) => Promise<JobResult>;

export type RegisteredJob = {
  name: JobName;
  handler: JobHandler;
  retryPolicy: RetryPolicyName;
  description?: string;
};

export type SchedulerStatus = "stopped" | "starting" | "running" | "stopping";

export type SchedulerHealth = {
  status: SchedulerStatus;
  enabled: boolean;
  startedAt: string | null;
  lastTickAt: string | null;
  registeredJobs: number;
  schedules: number;
  inFlight: number;
  lastError: string | null;
  lockModeAssumption: string;
};

export type QueueHealth = {
  status: "ok" | "degraded" | "down";
  detail: string;
  /** In-process only until distributed queues ship */
  backend: "in_process";
  depth: number;
};
