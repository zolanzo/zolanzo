/**
 * Capability composition engine — pure validation & inference.
 */

import {
  evidenceKindsForCapabilities,
  WORK_CAPABILITY_CATALOG,
  type EvidenceKind,
  type WorkCapability,
} from "@/constants/work-capabilities";
import type {
  EvidenceRequirement,
  TemplateStepDefinition,
} from "@/features/task-templates/types";

export type CompositionResult = {
  ok: true;
  capabilities: WorkCapability[];
  inferredEvidence: EvidenceKind[];
} | {
  ok: false;
  errors: string[];
};

export function composeCapabilitySet(
  steps: readonly TemplateStepDefinition[],
): CompositionResult {
  const errors: string[] = [];
  const keys = new Set<string>();
  const capabilities: WorkCapability[] = [];

  if (steps.length === 0) {
    return { ok: false, errors: ["Capability set must include at least one step"] };
  }

  for (const step of steps) {
    if (!step.key.trim()) errors.push("Step key is required");
    if (keys.has(step.key)) errors.push(`Duplicate step key: ${step.key}`);
    keys.add(step.key);

    if (!(step.capability in WORK_CAPABILITY_CATALOG)) {
      errors.push(`Unknown capability: ${step.capability}`);
      continue;
    }
    capabilities.push(step.capability);

    if (!step.instruction.trim()) {
      errors.push(`Step ${step.key} needs an instruction`);
    }
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    capabilities,
    inferredEvidence: evidenceKindsForCapabilities(capabilities),
  };
}

/**
 * Ensure declared evidence requirements are covered by composed capabilities
 * (or explicitly allowed as custom).
 */
export function alignEvidenceRequirements(
  steps: readonly TemplateStepDefinition[],
  requiredEvidence: readonly EvidenceRequirement[],
): { ok: true } | { ok: false; errors: string[] } {
  const composition = composeCapabilitySet(steps);
  if (!composition.ok) return composition;

  const errors: string[] = [];
  const inferred = new Set(composition.inferredEvidence);
  const stepKeys = new Set(steps.map((s) => s.key));

  for (const req of requiredEvidence) {
    if (req.stepKey && !stepKeys.has(req.stepKey)) {
      errors.push(`Evidence references unknown stepKey: ${req.stepKey}`);
    }
    if (
      req.kind !== "custom" &&
      !inferred.has(req.kind) &&
      req.required
    ) {
      errors.push(
        `Required evidence kind "${req.kind}" is not produced by capability set`,
      );
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function defaultEvidenceFromSteps(
  steps: readonly TemplateStepDefinition[],
): EvidenceRequirement[] {
  const composition = composeCapabilitySet(steps);
  if (!composition.ok) return [];
  return composition.inferredEvidence.map((kind) => ({
    kind,
    required: true,
  }));
}
