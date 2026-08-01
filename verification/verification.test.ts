/**
 * Production verification suite — automated tests.
 */

import { describe, expect, it } from "vitest";
import {
  runProductionVerification,
  renderProductionVerificationMarkdown,
} from "@/verification";
import { WORKFLOW_SURFACES, INFRA_SURFACES, pathContract } from "@/verification/surfaces";

describe("Production verification — surfaces", () => {
  it("exposes all workflow path surfaces", () => {
    for (const [name, paths] of Object.entries(WORKFLOW_SURFACES)) {
      const result = pathContract(paths);
      expect(result.ok, `${name} missing ${result.missing.join(", ")}`).toBe(
        true,
      );
    }
  });

  it("exposes all infrastructure path surfaces", () => {
    for (const [name, paths] of Object.entries(INFRA_SURFACES)) {
      const result = pathContract(paths);
      expect(result.ok, `${name} missing ${result.missing.join(", ")}`).toBe(
        true,
      );
    }
  });
});

describe("Production verification — suite", () => {
  it("runs end-to-end automated verification without writing report by default in test", async () => {
    const report = await runProductionVerification({ writeReport: false });
    expect(report.mode).toBe("automated_suite");
    expect(report.workflows.length).toBeGreaterThanOrEqual(15);
    expect(report.infrastructure.length).toBeGreaterThanOrEqual(10);
    expect(report.summary.total).toBe(
      report.workflows.length + report.infrastructure.length,
    );
    expect(report.summary.failed).toBe(0);
    expect(report.summary.readinessScore).toBeGreaterThanOrEqual(50);
    expect(["ready", "conditional"]).toContain(report.summary.verdict);
    // Unreachable configured DB is blocked (connectivity), not a code FAIL
    const db = report.infrastructure.find((c) => c.id === "infra.database");
    expect(["pass", "warn", "blocked"]).toContain(db?.status);
    if (!report.databaseReachable) {
      expect(report.summary.verdict).toBe("conditional");
    }
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.performance.length).toBeGreaterThan(0);
  });

  it("renders markdown with required sections", async () => {
    const report = await runProductionVerification({ writeReport: false });
    const md = renderProductionVerificationMarkdown(report);
    expect(md).toContain("## Failures");
    expect(md).toContain("## Warnings");
    expect(md).toContain("## Performance");
    expect(md).toContain("## Recommendations");
    expect(md).toContain("## Workflow checks");
    expect(md).toContain("## Infrastructure checks");
  });

  it("passes executable engine workflows", async () => {
    const report = await runProductionVerification({ writeReport: false });
    const byId = Object.fromEntries(
      report.workflows.map((w) => [w.id, w] as const),
    );
    for (const id of [
      "wf.trust_update",
      "wf.analytics_update",
      "wf.report_generation",
      "wf.automation_trigger",
      "wf.webhook_delivery",
      "wf.connector_execution",
    ]) {
      expect(byId[id]?.status, id).toBe("pass");
    }
    expect(["pass", "warn"]).toContain(byId["wf.forecast_generation"]?.status);
  });
});
