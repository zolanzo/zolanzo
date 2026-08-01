/**
 * CampaignRuleEvaluator — campaign-specific advisory rule checks.
 */

import type {
  CampaignRuleCheck,
  ReviewContextBundle,
} from "@/lib/ai/review/review-types";

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export function evaluateCampaignRules(
  ctx: ReviewContextBundle,
): CampaignRuleCheck[] {
  const checks: CampaignRuleCheck[] = [];
  const activeImages = ctx.evidenceItems.filter(
    (i) => !i.replacedAt && i.kind === "image",
  ).length;
  const presentKinds = new Set(
    ctx.evidenceItems.filter((i) => !i.replacedAt).map((i) => i.kind),
  );

  if (ctx.campaignRules.length === 0) {
    // Implicit rules from required kinds / GPS
    if (ctx.requiredEvidenceKinds.length > 0) {
      const missing = ctx.requiredEvidenceKinds.filter((k) => !presentKinds.has(k));
      checks.push({
        ruleId: "implicit.required_kinds",
        label: `Campaign requires: ${ctx.requiredEvidenceKinds.join(", ")}`,
        status: missing.length === 0 ? "pass" : "fail",
        detail:
          missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined,
      });
    }
    if (ctx.gpsWithinBoundary != null) {
      checks.push({
        ruleId: "implicit.gps_boundary",
        label: "GPS within campaign boundary",
        status: ctx.gpsWithinBoundary ? "pass" : "fail",
      });
    }
    return checks;
  }

  for (const rule of ctx.campaignRules) {
    switch (rule.kind) {
      case "required_photo_count": {
        const min = asNumber(rule.params.min ?? rule.params.count, 1);
        checks.push({
          ruleId: rule.id,
          label: rule.label || `Requires ${min} photo(s)`,
          status: activeImages >= min ? "pass" : "fail",
          detail: `Found ${activeImages}, need ${min}`,
        });
        break;
      }
      case "gps_radius_m": {
        if (!ctx.gpsPresent) {
          checks.push({
            ruleId: rule.id,
            label: rule.label || "GPS required within radius",
            status: "fail",
            detail: "GPS missing",
          });
        } else if (ctx.gpsWithinBoundary == null) {
          checks.push({
            ruleId: rule.id,
            label: rule.label || "GPS radius check",
            status: "warning",
            detail: "Boundary data unavailable",
          });
        } else {
          checks.push({
            ruleId: rule.id,
            label:
              rule.label ||
              `GPS within ${asNumber(rule.params.radiusM, 500)} m`,
            status: ctx.gpsWithinBoundary ? "pass" : "fail",
          });
        }
        break;
      }
      case "manager_approval": {
        const hasApproval = ctx.presentFormFields.includes(
          String(rule.params.field ?? "manager_approval"),
        );
        checks.push({
          ruleId: rule.id,
          label: rule.label || "Manager approval required",
          status: hasApproval ? "pass" : "fail",
          detail: hasApproval ? undefined : "Supervisor signature / approval missing",
        });
        break;
      }
      case "required_kinds": {
        const kinds = asStringArray(rule.params.kinds);
        const missing = kinds.filter((k) => !presentKinds.has(k));
        checks.push({
          ruleId: rule.id,
          label: rule.label || `Required kinds: ${kinds.join(", ")}`,
          status: missing.length === 0 ? "pass" : "fail",
          detail:
            missing.length > 0 ? `Missing: ${missing.join(", ")}` : undefined,
        });
        break;
      }
      default: {
        checks.push({
          ruleId: rule.id,
          label: rule.label || rule.id,
          status: "not_applicable",
          detail: "Custom rule — manual review",
        });
      }
    }
  }

  return checks;
}
