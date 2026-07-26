/**
 * Aggregate validator results into a Validation Report summary.
 */

import type { ValidationReportStatus } from "@/constants/work-states";
import type {
  AggregatedValidation,
  ValidatorResult,
} from "@/features/verification/types";

export function aggregateValidatorResults(
  results: ValidatorResult[],
  durationMs: number,
): AggregatedValidation {
  const warnings: string[] = [];
  const failures: string[] = [];
  let passedChecks = 0;
  let skippedChecks = 0;
  const scored: number[] = [];

  for (const result of results) {
    if (result.status === "pass") {
      passedChecks += 1;
      if (result.score !== null) scored.push(result.score);
    } else if (result.status === "warning") {
      warnings.push(
        ...result.messages.map((m) => `[${result.validatorName}] ${m}`),
      );
      if (result.score !== null) scored.push(result.score);
    } else if (result.status === "fail") {
      failures.push(
        ...result.messages.map((m) => `[${result.validatorName}] ${m}`),
      );
      if (result.score !== null) scored.push(result.score);
    } else {
      skippedChecks += 1;
    }
  }

  let overallStatus: ValidationReportStatus;
  if (failures.length > 0) {
    overallStatus = "failed";
  } else if (warnings.length > 0) {
    overallStatus = "passed_with_warnings";
  } else {
    overallStatus = "passed";
  }

  const overallScore =
    scored.length === 0
      ? overallStatus === "failed"
        ? 0
        : 100
      : Math.round(
          (scored.reduce((a, b) => a + b, 0) / scored.length) * 100,
        ) / 100;

  return {
    overallStatus,
    overallScore,
    results,
    warnings,
    failures,
    passedChecks,
    skippedChecks,
    durationMs,
  };
}
