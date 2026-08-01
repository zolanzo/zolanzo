/**
 * In-process cron runner — start / stop / health / graceful shutdown.
 */

import { CRON_SCHEDULES, type CronSchedule } from "@/jobs/schedules";
import { cronFireKey, cronMatchesUtc } from "@/lib/reliability/cron";
import { createLogger } from "@/lib/observability/logger";
import { dependencyRegistry } from "@/lib/reliability/dependency-registry";
import { executeRegisteredJob } from "@/jobs/runner/execute";
import { listRegisteredJobs } from "@/jobs/runner/registry";
import type {
  QueueHealth,
  SchedulerHealth,
  SchedulerStatus,
} from "@/jobs/runner/types";

const log = createLogger("jobs.cron-runner");

const TICK_MS = 15_000;
const FIRE_KEY_RETENTION = 2;

export class CronRunner {
  private status: SchedulerStatus = "stopped";
  private timer: ReturnType<typeof setInterval> | null = null;
  private startedAt: string | null = null;
  private lastTickAt: string | null = null;
  private lastError: string | null = null;
  private inFlight = 0;
  private readonly fired = new Set<string>();
  private readonly schedules: readonly CronSchedule[];
  private shuttingDown = false;
  private readonly pending = new Set<Promise<unknown>>();

  constructor(schedules: readonly CronSchedule[] = CRON_SCHEDULES) {
    this.schedules = schedules;
  }

  getHealth(): SchedulerHealth {
    return {
      status: this.status,
      enabled: this.status === "running" || this.status === "starting",
      startedAt: this.startedAt,
      lastTickAt: this.lastTickAt,
      registeredJobs: listRegisteredJobs().length,
      schedules: this.schedules.length,
      inFlight: this.inFlight,
      lastError: this.lastError,
      lockModeAssumption:
        "Postgres advisory lock when DATABASE_URL set; else in-process mutex. Distributed Redis locks deferred.",
    };
  }

  getQueueHealth(): QueueHealth {
    return {
      status: this.status === "running" ? "ok" : "degraded",
      detail:
        this.status === "running"
          ? "in-process scheduler active"
          : "scheduler not running",
      backend: "in_process",
      depth: this.inFlight,
    };
  }

  start(): void {
    if (this.status === "running" || this.status === "starting") {
      return;
    }
    this.shuttingDown = false;
    this.status = "starting";
    this.startedAt = new Date().toISOString();
    this.lastError = null;

    // Immediate tick then interval
    void this.safeTick();
    this.timer = setInterval(() => {
      void this.safeTick();
    }, TICK_MS);
    // Allow process to exit even if interval is active (CLI can keep alive)
    if (typeof this.timer === "object" && "unref" in this.timer) {
      this.timer.unref?.();
    }

    this.status = "running";
    dependencyRegistry.report({
      id: "scheduler",
      status: "healthy",
      detail: "cron runner started",
      metadata: { schedules: this.schedules.length },
    });
    log.info("Cron runner started", {
      schedules: this.schedules.length,
      registeredJobs: listRegisteredJobs().length,
    });
  }

  async stop(): Promise<void> {
    if (this.status === "stopped") return;
    this.status = "stopping";
    this.shuttingDown = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.drain();
    this.status = "stopped";
    dependencyRegistry.report({
      id: "scheduler",
      status: "degraded",
      detail: "cron runner stopped",
    });
    log.info("Cron runner stopped");
  }

  /** Graceful shutdown — stop scheduling and wait for in-flight jobs. */
  async shutdown(timeoutMs = 30_000): Promise<void> {
    log.info("Cron runner shutting down", { timeoutMs, inFlight: this.inFlight });
    this.shuttingDown = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.status = "stopping";

    const drainPromise = this.drain();
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    });
    await Promise.race([drainPromise, timeout]);

    this.status = "stopped";
    dependencyRegistry.report({
      id: "scheduler",
      status: "unavailable",
      detail: "cron runner shut down",
    });
  }

  /** Test / ops: run due schedules once for `now`. */
  async tick(now = new Date()): Promise<void> {
    if (this.shuttingDown) return;
    this.lastTickAt = now.toISOString();
    this.pruneFiredKeys(now);

    for (const schedule of this.schedules) {
      if (!cronMatchesUtc(schedule.cron, now)) continue;
      const key = cronFireKey(schedule.job, now);
      if (this.fired.has(key)) continue;
      this.fired.add(key);

      const task = this.runSchedule(schedule);
      this.pending.add(task);
      void task.finally(() => this.pending.delete(task));
    }

    dependencyRegistry.report({
      id: "scheduler",
      status: this.status === "running" ? "healthy" : "degraded",
      detail: `last tick ${this.lastTickAt}`,
      metadata: { inFlight: this.inFlight },
    });
  }

  private async safeTick(): Promise<void> {
    try {
      await this.tick();
    } catch (error) {
      this.lastError =
        error instanceof Error ? error.message : String(error);
      log.error("Cron tick failed", {
        err: { message: this.lastError },
      });
      dependencyRegistry.report({
        id: "scheduler",
        status: "degraded",
        detail: this.lastError,
      });
    }
  }

  private async runSchedule(schedule: CronSchedule): Promise<void> {
    this.inFlight += 1;
    try {
      await executeRegisteredJob({
        jobName: schedule.job,
        schedule: schedule.cron,
        // Unit tests must not depend on Postgres advisory locks.
        skipLock:
          process.env.VITEST === "true" || process.env.NODE_ENV === "test",
      });
    } finally {
      this.inFlight = Math.max(0, this.inFlight - 1);
    }
  }

  private async drain(): Promise<void> {
    while (this.pending.size > 0 || this.inFlight > 0) {
      await Promise.allSettled([...this.pending]);
      if (this.inFlight === 0 && this.pending.size === 0) break;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private pruneFiredKeys(now: Date): void {
    const keep = new Set<string>();
    for (let i = 0; i < FIRE_KEY_RETENTION; i += 1) {
      const d = new Date(now.getTime() - i * 60_000);
      for (const schedule of this.schedules) {
        keep.add(cronFireKey(schedule.job, d));
      }
    }
    for (const key of [...this.fired]) {
      if (!keep.has(key)) this.fired.delete(key);
    }
  }
}

let singleton: CronRunner | null = null;

export function getCronRunner(): CronRunner {
  if (!singleton) {
    singleton = new CronRunner();
  }
  return singleton;
}

/** Test helper */
export function resetCronRunner(): void {
  singleton = null;
}
