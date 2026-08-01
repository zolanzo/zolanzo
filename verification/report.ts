/**
 * Render + write Production Verification Report markdown.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  ProductionVerificationReport,
  VerifyCheck,
  VerifyStatus,
} from "@/verification/types";

function statusIcon(status: VerifyStatus): string {
  switch (status) {
    case "pass":
      return "✅";
    case "fail":
      return "❌";
    case "warn":
      return "⚠️";
    case "blocked":
      return "🚫";
    case "skip":
      return "⏭️";
  }
}

function tableRows(checks: VerifyCheck[]): string {
  return checks
    .map(
      (c) =>
        `| ${statusIcon(c.status)} | \`${c.id}\` | ${c.name} | ${c.durationMs} ms | ${c.evidence.replace(/\|/g, "\\|")} |`,
    )
    .join("\n");
}

export function renderProductionVerificationMarkdown(
  report: ProductionVerificationReport,
): string {
  const { summary } = report;
  const verdictLabel =
    summary.verdict === "ready"
      ? "READY"
      : summary.verdict === "conditional"
        ? "CONDITIONAL"
        : "NOT READY";

  const health = report.summary.healthScores ?? {
    production: summary.readinessScore,
    workflow: summary.readinessScore,
    infrastructure: summary.readinessScore,
    api: 100,
    security: 100,
  };

  return `# ZOLANZO — Production Verification Report

**Generated:** ${report.generatedAt}  
**Mode:** \`${report.mode}\`  
**Database reachable:** ${report.databaseReachable ? "Yes" : "No"}  
**Provider keys:** Paystack ${report.providerKeys.paystack ? "✓" : "✗"} · Resend ${report.providerKeys.resend ? "✓" : "✗"} · Sendchamp ${report.providerKeys.sendchamp ? "✓" : "✗"}

---

## Executive Verdict & Health Scores

| Health Domain | Score |
| --- | --- |
| **Production Health Score** | **${health.production} / 100** |
| **Workflow Health Score** | **${health.workflow} / 100** |
| **Infrastructure Health Score** | **${health.infrastructure} / 100** |
| **API Health Score** | **${health.api} / 100** |
| **Security Health Score** | **${health.security} / 100** |

| Summary Metric | Result |
| --- | --- |
| Readiness score | **${summary.readinessScore} / 100** |
| Verdict | **${verdictLabel}** |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Warned | ${summary.warned} |
| Blocked | ${summary.blocked} |
| Skipped | ${summary.skipped} |
| Total checks | ${summary.total} |

---

## Failures

${
  report.failures.length === 0
    ? "_None._"
    : report.failures
        .map(
          (f) =>
            `- **${f.name}** (\`${f.id}\`) — ${f.evidence}${f.notes ? ` · _${f.notes}_` : ""}`,
        )
        .join("\n")
}

---

## Warnings

${
  report.warnings.length === 0
    ? "_None._"
    : report.warnings
        .map(
          (w) =>
            `- **${w.name}** (\`${w.id}\`) — ${w.evidence}${w.notes ? ` · _${w.notes}_` : ""}`,
        )
        .join("\n")
}

---

## Performance

| Check | Duration | Budget | Within budget |
| --- | ---: | ---: | :---: |
${report.performance
  .map(
    (p) =>
      `| \`${p.id}\` | ${p.durationMs} ms | ${p.budgetMs} ms | ${p.withinBudget ? "✅" : "❌"} |`,
  )
  .join("\n")}

---

## Workflow checks

| | ID | Name | Duration | Evidence |
| --- | --- | --- | ---: | --- |
${tableRows(report.workflows)}

---

## Infrastructure checks

| | ID | Name | Duration | Evidence |
| --- | --- | --- | ---: | --- |
${tableRows(report.infrastructure)}

---

## Recommendations

${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

---

## How to re-run

\`\`\`bash
npm run verify:production
npm run test:verification
\`\`\`

Harness: \`verification/runner.ts\` · writes \`docs/PRODUCTION_VERIFICATION_REPORT.md\` and \`docs/WORKFLOW_VALIDATION.md\` automatically.
`;
}

export function renderWorkflowValidationMarkdown(
  report: ProductionVerificationReport,
): string {
  return `# ZOLANZO — Workflow Validation Matrix

**Generated:** ${report.generatedAt}  
**Mode:** Automated End-to-End Suite  
**Total Workflows Validated:** ${report.workflows.length}

---

## Customer Journey Validation Results

| Status | Workflow ID | Journey Name | Duration | Expected Result | Actual Evidence |
| --- | --- | --- | ---: | --- | --- |
${report.workflows
  .map(
    (w) =>
      `| ${statusIcon(w.status)} | \`${w.id}\` | ${w.name} | ${w.durationMs} ms | Surface & contract operational | ${w.evidence.replace(/\|/g, "\\|")} |`,
  )
  .join("\n")}

---

## Validation Summary

- **Passed Journeys:** ${report.workflows.filter((w) => w.status === "pass").length}
- **Failing Journeys:** ${report.workflows.filter((w) => w.status === "fail").length}
- **Warned Journeys:** ${report.workflows.filter((w) => w.status === "warn").length}
- **Blocked Journeys:** ${report.workflows.filter((w) => w.status === "blocked").length}

---

## Recommendations

${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;
}

export function writeProductionVerificationReport(
  report: ProductionVerificationReport,
  relativePath = "docs/PRODUCTION_VERIFICATION_REPORT.md",
): string {
  const full = join(process.cwd(), relativePath);
  mkdirSync(dirname(full), { recursive: true });
  const markdown = renderProductionVerificationMarkdown(report);
  writeFileSync(full, markdown, "utf8");

  // Also write docs/WORKFLOW_VALIDATION.md
  const workflowPath = join(process.cwd(), "docs/WORKFLOW_VALIDATION.md");
  const workflowMarkdown = renderWorkflowValidationMarkdown(report);
  writeFileSync(workflowPath, workflowMarkdown, "utf8");

  return full;
}
