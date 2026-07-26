/**
 * Validation rule definitions for Task Templates.
 */

import type { ValidationMode } from "@/constants/work-states";

export type ValidationRuleDefinition = {
  mode: ValidationMode;
  /** Named rule keys evaluated by future validation pipeline */
  ruleKeys: string[];
  aiAssist?: boolean;
  autoApproveIf?: string[];
  rejectIf?: string[];
};

export function validateValidationRules(
  rules: ValidationRuleDefinition,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const modes = ["ai", "automatic", "manual", "hybrid", "rule_based"];
  if (!modes.includes(rules.mode)) {
    errors.push(`Unknown validation mode: ${rules.mode}`);
  }
  if (rules.mode === "rule_based" && rules.ruleKeys.length === 0) {
    errors.push("rule_based validation requires ruleKeys");
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
