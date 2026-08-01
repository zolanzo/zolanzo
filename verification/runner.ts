/**
 * Production verification suite runner.
 * Exercises path contracts + executable engines + infrastructure probes.
 */

import { providerKeysPresent } from "@/verification/surfaces";
import { runWorkflowVerification } from "@/verification/workflows";
import { runInfrastructureVerification } from "@/verification/infrastructure";
import {
  renderProductionVerificationMarkdown,
  writeProductionVerificationReport,
} from "@/verification/report";
import type {
  ProductionVerificationReport,
  VerifyCheck,
  VerifyPerformanceSample,
} from "@/verification/types";

const PERFORMANCE_BUDGETS: Record<string, number> = {
  "wf.trust_update": 500,
  "wf.analytics_update": 500,
  "wf.forecast_generation": 2_000,
  "wf.report_generation": 2_000,
  "wf.automation_trigger": 500,
  "wf.webhook_delivery": 1_000,
  "wf.connector_execution": 1_000,
  "infra.public_api": 1_000,
  "infra.database": 3_000,
  "infra.storage": 3_000,
};

function countBy(
  checks: VerifyCheck[],
  status: VerifyCheck["status"],
): number {
  return checks.filter((c) => c.status === status).length;
}

function buildRecommendations(
  workflows: VerifyCheck[],
  infrastructure: VerifyCheck[],
  databaseReachable: boolean,
  keys: ReturnType<typeof providerKeysPresent>,
  performance: VerifyPerformanceSample[],
): string[] {
  const recs: string[] = [];
  const all = [...workflows, ...infrastructure];
  const failures = all.filter((c) => c.status === "fail");
  const _warnings = all.filter(
    (c) => c.status === "warn" || c.status === "blocked",
  );

  if (failures.length > 0) {
    recs.push(
      `Resolve ${failures.length} failing check(s) before production traffic: ${failures.map((f) => f.id).join(", ")}.`,
    );
  }
  if (!databaseReachable) {
    recs.push(
      "Run the suite against staging with DATABASE_URL + Supabase credentials to clear live DB and dual-session gates.",
    );
  }
  if (!keys.paystack) {
    recs.push(
      "Configure Paystack secrets and run a funding → settlement smoke on staging.",
    );
  }
  if (!keys.resend) {
    recs.push(
      "Configure Resend and verify notification hub delivery (welcome / settlement receipts).",
    );
  }
  if (!keys.sendchamp) {
    recs.push(
      "Optionally configure Sendchamp for SMS channel verification (YIKE account).",
    );
  }
  const slow = performance.filter((p) => !p.withinBudget);
  if (slow.length > 0) {
    recs.push(
      `Investigate performance budget misses: ${slow.map((s) => `${s.id} (${s.durationMs}ms > ${s.budgetMs}ms)`).join("; ")}.`,
    );
  }
  const liveDomain = workflows.filter((w) =>
    [
      "wf.worker_signup",
      "wf.organization_signup",
      "wf.campaign_creation",
      "wf.assignment_claim",
      "wf.submission",
      "wf.review",
      "wf.approval",
      "wf.settlement",
    ].includes(w.id),
  );
  if (liveDomain.every((w) => w.status === "pass")) {
    recs.push(
      "Domain path contracts are green — schedule a staging browser E2E for signup → claim → submit → review → settle.",
    );
  }
  if (recs.length === 0) {
    recs.push("All automated gates passed — proceed to staged canary launch.");
  }
  return recs;
}

function readinessScore(checks: VerifyCheck[]): number {
  if (checks.length === 0) return 0;
  let points = 0;
  for (const c of checks) {
    if (c.status === "pass") points += 1;
    else if (c.status === "warn") points += 0.6;
    else if (c.status === "blocked") points += 0.4;
    else if (c.status === "skip") points += 0.5;
  }
  return Math.round((points / checks.length) * 100);
}

function verdictFrom(
  score: number,
  failed: number,
  blocked: number,
  databaseReachable: boolean,
): ProductionVerificationReport["summary"]["verdict"] {
  if (failed > 0 || score < 55) return "not_ready";
  if (!databaseReachable || blocked > 0 || score < 85) return "conditional";
  return "ready";
}

export type RunProductionVerificationOptions = {
  /** Write docs/PRODUCTION_VERIFICATION_REPORT.md (default true for CLI). */
  writeReport?: boolean;
};

export async function runProductionVerification(
  options: RunProductionVerificationOptions = {},
): Promise<ProductionVerificationReport> {
  const keys = providerKeysPresent();
  const [workflows, infra] = await Promise.all([
    runWorkflowVerification(),
    runInfrastructureVerification(),
  ]);

  const all = [...workflows, ...infra.checks];
  const failures = all.filter((c) => c.status === "fail");
  const warnings = all.filter(
    (c) => c.status === "warn" || c.status === "blocked",
  );

  const performance: VerifyPerformanceSample[] = all
    .filter((c) => c.id in PERFORMANCE_BUDGETS)
    .map((c) => {
      const budgetMs = PERFORMANCE_BUDGETS[c.id]!;
      return {
        id: c.id,
        durationMs: c.durationMs,
        budgetMs,
        withinBudget: c.durationMs <= budgetMs,
      };
    });

  const score = readinessScore(all);
  const workflowScore = readinessScore(workflows);
  const infraScore = readinessScore(infra.checks);

  const apiChecks = all.filter((c) =>
    [
      "infra.public_api",
      "infra.webhooks",
      "infra.connectors",
      "wf.webhook_delivery",
      "wf.connector_execution",
    ].includes(c.id),
  );
  const apiScore = readinessScore(apiChecks);

  const securityChecks = all.filter((c) =>
    [
      "infra.public_api",
      "wf.authentication",
      "wf.settlement",
      "wf.webhook_delivery",
    ].includes(c.id),
  );
  const securityScore = readinessScore(securityChecks);

  const failed = countBy(all, "fail");
  const report: ProductionVerificationReport = {
    generatedAt: new Date().toISOString(),
    mode: "automated_suite",
    databaseReachable: infra.databaseReachable,
    providerKeys: keys,
    workflows,
    infrastructure: infra.checks,
    failures,
    warnings,
    performance,
    recommendations: buildRecommendations(
      workflows,
      infra.checks,
      infra.databaseReachable,
      keys,
      performance,
    ),
    summary: {
      total: all.length,
      passed: countBy(all, "pass"),
      failed,
      warned: countBy(all, "warn"),
      blocked: countBy(all, "blocked"),
      skipped: countBy(all, "skip"),
      readinessScore: score,
      verdict: verdictFrom(
        score,
        failed,
        countBy(all, "blocked"),
        infra.databaseReachable,
      ),
      healthScores: {
        production: score,
        workflow: workflowScore,
        infrastructure: infraScore,
        api: apiScore,
        security: securityScore,
      },
    },
  };

  if (options.writeReport !== false) {
    writeProductionVerificationReport(report);
  }

  return report;
}

export {
  renderProductionVerificationMarkdown,
  writeProductionVerificationReport,
};
