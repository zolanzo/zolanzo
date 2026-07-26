/**
 * Helper to build ValidatorResult with timing.
 */

import type { ValidatorName, ValidatorResultStatus } from "@/constants/work-states";
import type { ValidatorResult } from "@/features/verification/types";

export function makeResult(params: {
  name: ValidatorName;
  status: ValidatorResultStatus;
  score: number | null;
  startedAt: number;
  messages?: string[];
  metadata?: Record<string, unknown> | null;
}): ValidatorResult {
  return {
    validatorName: params.name,
    status: params.status,
    score: params.score,
    durationMs: Math.max(0, Date.now() - params.startedAt),
    messages: params.messages ?? [],
    metadata: params.metadata ?? null,
  };
}
