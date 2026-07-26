import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

export const stepCompletionValidator: Validator = {
  name: "step_completion",
  validate(ctx) {
    const startedAt = Date.now();
    if (!ctx.summary) {
      return makeResult({
        name: "step_completion",
        status: "warning",
        score: 50,
        startedAt,
        messages: ["Submission summary missing — cannot verify steps"],
      });
    }

    const { requiredSteps, requiredCompleted, completedSteps } = ctx.summary;
    if (requiredSteps > 0 && requiredCompleted < requiredSteps) {
      return makeResult({
        name: "step_completion",
        status: "fail",
        score: Math.round((requiredCompleted / requiredSteps) * 100),
        startedAt,
        messages: [
          `Required steps incomplete: ${requiredCompleted}/${requiredSteps}`,
        ],
        metadata: { requiredSteps, requiredCompleted, completedSteps },
      });
    }

    return makeResult({
      name: "step_completion",
      status: "pass",
      score: 100,
      startedAt,
      messages: ["Required steps completed"],
      metadata: { requiredSteps, requiredCompleted, completedSteps },
    });
  },
};
