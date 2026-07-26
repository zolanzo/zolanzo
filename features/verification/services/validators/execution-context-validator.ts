import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

const REQUIRED_KEYS = [
  "taskTemplateId",
  "taskTemplateVersion",
  "campaignId",
  "workerUserId",
  "capturedAt",
] as const;

export const executionContextValidator: Validator = {
  name: "execution_context",
  validate(ctx) {
    const startedAt = Date.now();
    const missing: string[] = [];
    for (const key of REQUIRED_KEYS) {
      const value = ctx.executionContext[key];
      if (value === null || value === undefined || value === "") {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      return makeResult({
        name: "execution_context",
        status: "fail",
        score: 0,
        startedAt,
        messages: [`Execution context missing keys: ${missing.join(", ")}`],
      });
    }

    const warnings: string[] = [];
    if (!ctx.executionContext.eligibility.eligible) {
      warnings.push("Execution context recorded ineligible claim");
    }

    if (warnings.length > 0) {
      return makeResult({
        name: "execution_context",
        status: "warning",
        score: 75,
        startedAt,
        messages: warnings,
        metadata: {
          hardFailureIds: ctx.executionContext.eligibility.hardFailureIds,
        },
      });
    }

    return makeResult({
      name: "execution_context",
      status: "pass",
      score: 100,
      startedAt,
      messages: ["Execution context snapshot intact"],
      metadata: {
        taskTemplateVersion: ctx.executionContext.taskTemplateVersion,
        campaignPublicId: ctx.executionContext.campaignPublicId,
      },
    });
  },
};
