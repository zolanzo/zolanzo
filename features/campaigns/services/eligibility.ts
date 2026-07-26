/**
 * Eligibility resolution — merge template + campaign + org policy constraints.
 * Does not filter workers yet.
 */

import type { TemplateConstraint } from "@/constants/constraints";
import { validateConstraintDefinitions } from "@/constants/constraints";
import type { OrgEligibilityPolicy } from "@/features/campaigns/types";

export type EligibilityMergeInput = {
  templateConstraints: readonly TemplateConstraint[];
  /** Campaign-level constraints that override or extend template ones */
  campaignConstraints: readonly TemplateConstraint[];
  /** Organization policy constraints (lowest precedence unless same id) */
  organizationPolicies?: OrgEligibilityPolicy | null;
  /** When true, later sources with same id replace earlier (default true) */
  overrideById?: boolean;
};

export type MergedEligibility = {
  constraints: TemplateConstraint[];
  sourceById: Record<string, "organization" | "template" | "campaign">;
  errors: string[];
  ok: boolean;
};

/**
 * Merge order: organization → template → campaign.
 * Same `id` → later source wins when overrideById (default true).
 */
export function mergeEligibilityRules(
  input: EligibilityMergeInput,
): MergedEligibility {
  const overrideById = input.overrideById ?? true;
  const orgConstraints = input.organizationPolicies?.constraints ?? [];

  const checks = [
    validateConstraintDefinitions(orgConstraints),
    validateConstraintDefinitions(input.templateConstraints),
    validateConstraintDefinitions(input.campaignConstraints),
  ];
  const errors = checks.flatMap((c) => (c.ok ? [] : c.errors));

  const map = new Map<string, TemplateConstraint>();
  const sourceById: Record<
    string,
    "organization" | "template" | "campaign"
  > = {};

  const apply = (
    list: readonly TemplateConstraint[],
    source: "organization" | "template" | "campaign",
  ) => {
    for (const c of list) {
      if (map.has(c.id) && !overrideById) {
        errors.push(`Duplicate constraint id without override: ${c.id}`);
        continue;
      }
      map.set(c.id, c);
      sourceById[c.id] = source;
    }
  };

  apply(orgConstraints, "organization");
  apply(input.templateConstraints, "template");
  apply(input.campaignConstraints, "campaign");

  return {
    constraints: [...map.values()],
    sourceById,
    errors,
    ok: errors.length === 0,
  };
}
