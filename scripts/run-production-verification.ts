/**
 * CLI — run production verification and write docs/PRODUCTION_VERIFICATION_REPORT.md
 */

import { runProductionVerification } from "@/verification/runner";

async function main() {
  const report = await runProductionVerification({ writeReport: true });
  const { summary } = report;
  console.log(
    JSON.stringify(
      {
        verdict: summary.verdict,
        readinessScore: summary.readinessScore,
        passed: summary.passed,
        failed: summary.failed,
        warned: summary.warned,
        blocked: summary.blocked,
        total: summary.total,
        report: "docs/PRODUCTION_VERIFICATION_REPORT.md",
      },
      null,
      2,
    ),
  );
  if (summary.failed > 0 || summary.verdict === "not_ready") {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});