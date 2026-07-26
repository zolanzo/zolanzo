/**
 * Validation Pipeline — ordered execution of independent validators.
 */

import type { ValidationProfileDefinition } from "@/constants/validation-profiles";
import { aggregateValidatorResults } from "@/features/verification/services/aggregation";
import { getValidator } from "@/features/verification/services/validators";
import type {
  AggregatedValidation,
  ValidationContext,
  ValidatorResult,
} from "@/features/verification/types";

export async function runValidationPipeline(
  ctx: ValidationContext,
  profile: ValidationProfileDefinition = ctx.profile,
): Promise<AggregatedValidation> {
  const pipelineStarted = Date.now();
  const results: ValidatorResult[] = [];

  for (const name of profile.enabledValidators) {
    const validator = getValidator(name);
    const result = await Promise.resolve(validator.validate(ctx));
    results.push(result);
  }

  return aggregateValidatorResults(results, Date.now() - pipelineStarted);
}
