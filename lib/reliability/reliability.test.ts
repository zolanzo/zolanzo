import { describe, expect, it, beforeEach } from "vitest";
import {
  cronFireKey,
  cronMatchesUtc,
  parseCronExpression,
} from "@/lib/reliability/cron";
import {
  dependencyRegistry,
  probeStatusToDependency,
} from "@/lib/reliability/dependency-registry";
import { CronRunner, resetCronRunner } from "@/jobs/runner/cron-runner";
import {
  clearRegisteredJobs,
  listRegisteredJobs,
  registerJob,
} from "@/jobs/runner/registry";
import { executeRegisteredJob } from "@/jobs/runner/execute";
import type { JobName } from "@/jobs/names";

describe("cron matcher", () => {
  it("parses 5-field expressions", () => {
    const parts = parseCronExpression("*/5 * * * 1-5");
    expect(parts.minute).toBe("*/5");
    expect(parts.dayOfWeek).toBe("1-5");
  });

  it("matches every 5 minutes", () => {
    const d = new Date(Date.UTC(2026, 6, 26, 10, 15, 0));
    expect(cronMatchesUtc("*/5 * * * *", d)).toBe(true);
    expect(cronMatchesUtc("*/5 * * * *", new Date(Date.UTC(2026, 6, 26, 10, 16, 0)))).toBe(
      false,
    );
  });

  it("matches weekday settlement windows", () => {
    // Monday 10:00 UTC
    const mon = new Date(Date.UTC(2026, 6, 27, 10, 0, 0));
    expect(cronMatchesUtc("0 10,16 * * 1-5", mon)).toBe(true);
    // Sunday
    const sun = new Date(Date.UTC(2026, 6, 26, 10, 0, 0));
    expect(cronMatchesUtc("0 10,16 * * 1-5", sun)).toBe(false);
  });

  it("builds stable fire keys", () => {
    const d = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
    expect(cronFireKey("assignments.expire", d)).toBe(
      "assignments.expire:202601020304",
    );
  });
});

describe("dependency registry", () => {
  beforeEach(() => {
    dependencyRegistry.reset();
  });

  it("tracks status, latency, and timestamps", () => {
    dependencyRegistry.report({
      id: "database",
      status: "healthy",
      latencyMs: 12,
      detail: "connected",
    });
    const row = dependencyRegistry.get("database");
    expect(row.status).toBe("healthy");
    expect(row.latencyMs).toBe(12);
    expect(row.lastSuccessAt).toBeTruthy();
    expect(probeStatusToDependency("down")).toBe("unavailable");
    expect(dependencyRegistry.overall()).toBe("unavailable");
  });
});

describe("cron runner registration and lifecycle", () => {
  beforeEach(() => {
    resetCronRunner();
    clearRegisteredJobs();
  });

  it("registers handlers and executes with correlation logs path", async () => {
    let ran = 0;
    registerJob({
      name: "analytics.project-snapshot" as JobName,
      retryPolicy: "immediate",
      handler: async () => {
        ran += 1;
        return { ok: true, summary: "test", processed: 1 };
      },
    });

    expect(listRegisteredJobs()).toHaveLength(1);

    const report = await executeRegisteredJob({
      jobName: "analytics.project-snapshot",
      schedule: "0 * * * *",
      skipLock: true,
      sleep: async () => undefined,
    });
    expect(report.result?.ok).toBe(true);
    expect(report.skippedDuplicate).toBe(false);
    expect(ran).toBe(1);
    expect(report.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("ticks due schedules once per minute key", async () => {
    let ran = 0;
    registerJob({
      name: "analytics.project-snapshot" as JobName,
      retryPolicy: "immediate",
      handler: async () => {
        ran += 1;
        return { ok: true, processed: 1 };
      },
    });

    const runner = new CronRunner([
      {
        job: "analytics.project-snapshot",
        cron: "0 * * * *",
        description: "test",
      },
    ]);

    const now = new Date(Date.UTC(2026, 6, 26, 11, 0, 5));
    await runner.tick(now);
    await runner.tick(now);
    // allow async schedule tasks
    await new Promise((r) => setTimeout(r, 50));
    expect(ran).toBe(1);

    await runner.shutdown(1_000);
    expect(runner.getHealth().status).toBe("stopped");
  });

  it("exposes degraded queue health when stopped", () => {
    const runner = new CronRunner([]);
    expect(runner.getQueueHealth().status).toBe("degraded");
    runner.start();
    expect(runner.getHealth().status).toBe("running");
    expect(runner.getQueueHealth().status).toBe("ok");
    void runner.stop();
  });
});
