import { describe, expect, it } from "vitest";
import {
  getBuildVersion,
  getGitCommit,
  getProcessMeta,
  getStartupTimeIso,
  getUptimeSeconds,
} from "@/lib/observability/process-meta";

describe("process meta / health fields", () => {
  it("exposes build version, startup time, and uptime", () => {
    expect(typeof getBuildVersion()).toBe("string");
    expect(getBuildVersion().length).toBeGreaterThan(0);
    expect(getStartupTimeIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(getUptimeSeconds()).toBeGreaterThanOrEqual(0);
    expect(typeof getGitCommit() === "string" || getGitCommit() === null).toBe(
      true,
    );
  });

  it("getProcessMeta returns health-ready snapshot", () => {
    const meta = getProcessMeta();
    expect(meta).toMatchObject({
      buildVersion: expect.any(String),
      startupTime: expect.any(String),
      uptimeSeconds: expect.any(Number),
    });
  });
});
