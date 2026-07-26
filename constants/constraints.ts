/**
 * Constraint engine — conditions under which template work is valid.
 * Composable like capabilities; evaluated later by Marketplace / Assignment.
 */

export const CONSTRAINT_KINDS = [
  "device",
  "location",
  "time",
  "worker",
  "organization",
] as const;

export type ConstraintKind = (typeof CONSTRAINT_KINDS)[number];

export const DEVICE_CONSTRAINT_OPS = [
  "os_min",
  "os_exact",
  "platform_in",
  "manufacturer_in",
  "model_in",
] as const;

export const LOCATION_CONSTRAINT_OPS = [
  "country_in",
  "region_in",
  "city_in",
  "geofence_radius_m",
] as const;

export const TIME_CONSTRAINT_OPS = [
  "local_hours_window",
  "claim_ttl_minutes",
  "complete_by_absolute",
] as const;

export const WORKER_CONSTRAINT_OPS = [
  "min_trust_score",
  "min_approval_rate",
  "min_completed_tasks",
  "language_in",
  "skill_in",
] as const;

export const ORGANIZATION_CONSTRAINT_OPS = [
  "verified_business_required",
  "min_plan",
] as const;

export type TemplateConstraint = {
  id: string;
  kind: ConstraintKind;
  /** Operation key within the kind */
  op: string;
  /** Structured parameters for the op */
  params: Record<string, unknown>;
  /** Soft = warn/rank; hard = block eligibility */
  enforcement: "hard" | "soft";
  label?: string;
};

export function isConstraintKind(value: string): value is ConstraintKind {
  return (CONSTRAINT_KINDS as readonly string[]).includes(value);
}

/**
 * Validate constraint shape (not runtime eligibility — that is later).
 */
export function validateConstraintDefinitions(
  constraints: readonly TemplateConstraint[],
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const c of constraints) {
    if (!c.id?.trim()) errors.push("Constraint missing id");
    if (ids.has(c.id)) errors.push(`Duplicate constraint id: ${c.id}`);
    ids.add(c.id);
    if (!isConstraintKind(c.kind)) {
      errors.push(`Unknown constraint kind: ${c.kind}`);
    }
    if (!c.op?.trim()) errors.push(`Constraint ${c.id} missing op`);
    if (c.enforcement !== "hard" && c.enforcement !== "soft") {
      errors.push(`Constraint ${c.id} has invalid enforcement`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
