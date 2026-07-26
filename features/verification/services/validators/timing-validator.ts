import type { Validator } from "@/features/verification/types";
import { makeResult } from "@/features/verification/services/validators/result-helper";

export const timingValidator: Validator = {
  name: "timing",
  validate(ctx) {
    const startedAt = Date.now();
    const minSeconds = ctx.profile.config?.minTimeSpentSeconds ?? 0;
    const spent = ctx.summary?.timeSpentSeconds ?? null;

    if (spent === null) {
      return makeResult({
        name: "timing",
        status: "warning",
        score: 60,
        startedAt,
        messages: ["Time spent unavailable"],
      });
    }

    if (spent < 0) {
      return makeResult({
        name: "timing",
        status: "fail",
        score: 0,
        startedAt,
        messages: ["Invalid negative time spent"],
      });
    }

    if (minSeconds > 0 && spent < minSeconds) {
      return makeResult({
        name: "timing",
        status: "warning",
        score: Math.max(20, Math.round((spent / minSeconds) * 100)),
        startedAt,
        messages: [
          `Time spent ${spent}s below profile minimum ${minSeconds}s`,
        ],
        metadata: { spent, minSeconds },
      });
    }

    return makeResult({
      name: "timing",
      status: "pass",
      score: 100,
      startedAt,
      messages: [`Time spent ${spent}s acceptable`],
      metadata: { spent, minSeconds },
    });
  },
};
