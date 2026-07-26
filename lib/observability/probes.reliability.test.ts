import { describe, expect, it, beforeEach } from "vitest";
import {
  dependencyRegistry,
} from "@/lib/reliability/dependency-registry";
import { getLiveHealth, getReadinessHealth } from "@/lib/observability/probes";

describe("health aggregation", () => {
  beforeEach(() => {
    dependencyRegistry.reset();
  });

  it("liveness is always ok with process meta", async () => {
    const live = await getLiveHealth({ name: "zolanzo", version: "0.1.0" });
    expect(live.status).toBe("ok");
    expect(live.buildVersion).toBeTruthy();
    expect(live.startupTime).toMatch(/^\d{4}-/);
    expect(live.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it("readiness includes dependency registry, scheduler, and queue", async () => {
    const ready = await getReadinessHealth({
      name: "zolanzo",
      version: "0.1.0",
    });
    expect(ready.checks.map((c) => c.id)).toEqual(
      expect.arrayContaining([
        "app_alive",
        "environment",
        "database",
        "supabase_auth",
        "storage",
        "redis",
        "queue",
        "scheduler",
      ]),
    );
    expect(ready.dependencies?.length).toBeGreaterThan(0);
    expect(ready.scheduler).toBeTruthy();
    expect(ready.queue?.backend).toBe("in_process");
    expect(["ok", "degraded", "down"]).toContain(ready.status);
  });
});
