/**
 * Built-in validator registry.
 */

import type { ValidatorName } from "@/constants/work-states";
import type { Validator } from "@/features/verification/types";
import { manifestValidator } from "@/features/verification/services/validators/manifest-validator";
import { evidenceValidator } from "@/features/verification/services/validators/evidence-validator";
import { stepCompletionValidator } from "@/features/verification/services/validators/step-completion-validator";
import { timingValidator } from "@/features/verification/services/validators/timing-validator";
import { ruleValidator } from "@/features/verification/services/validators/rule-validator";
import { executionContextValidator } from "@/features/verification/services/validators/execution-context-validator";
import { fileReferenceValidator } from "@/features/verification/services/validators/file-reference-validator";
import { gpsValidator } from "@/features/verification/services/validators/gps-validator";
import { deviceValidator } from "@/features/verification/services/validators/device-validator";

export const BUILTIN_VALIDATORS: Record<ValidatorName, Validator> = {
  manifest: manifestValidator,
  evidence: evidenceValidator,
  step_completion: stepCompletionValidator,
  timing: timingValidator,
  rule: ruleValidator,
  execution_context: executionContextValidator,
  file_reference: fileReferenceValidator,
  gps: gpsValidator,
  device: deviceValidator,
};

export function getValidator(name: ValidatorName): Validator {
  return BUILTIN_VALIDATORS[name];
}
