/**
 * Evaluate merged constraints against a worker profile context.
 */

import type { TemplateConstraint } from "@/constants/constraints";
import type {
  EligibilityEvaluation,
  EligibilityFailure,
  WorkerEligibilityContext,
} from "@/features/task-marketplace/types/worker-context";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function evaluateConstraint(
  constraint: TemplateConstraint,
  worker: WorkerEligibilityContext,
): EligibilityFailure | null {
  const { kind, op, params, id, enforcement, label } = constraint;
  let ok = true;
  let reason = label ?? `${kind}.${op}`;

  switch (kind) {
    case "location": {
      if (op === "country_in") {
        const countries = asStringArray(params.countries);
        ok = Boolean(
          worker.countryCode && countries.includes(worker.countryCode),
        );
        if (!ok) reason = `Country must be one of: ${countries.join(", ")}`;
      }
      break;
    }
    case "worker": {
      if (op === "min_trust_score") {
        const min = asNumber(params.min, 0);
        ok = worker.trustScore >= min;
        if (!ok) reason = `Trust score must be >= ${min}`;
      } else if (op === "min_approval_rate") {
        const min = asNumber(params.min, 0);
        ok = worker.approvalRate >= min;
        if (!ok) reason = `Approval rate must be >= ${min}`;
      } else if (op === "min_completed_tasks") {
        const min = asNumber(params.min, 0);
        ok = worker.completedTasks >= min;
        if (!ok) reason = `Completed tasks must be >= ${min}`;
      } else if (op === "language_in") {
        const languages = asStringArray(params.languages);
        ok = languages.some((l) => worker.languages.includes(l));
        if (!ok) reason = `Language must intersect ${languages.join(", ")}`;
      } else if (op === "skill_in") {
        const skills = asStringArray(params.skills);
        ok = skills.some((s) => worker.skills.includes(s));
        if (!ok) reason = `Skill must intersect ${skills.join(", ")}`;
      }
      break;
    }
    case "device": {
      if (op === "platform_in") {
        const platforms = asStringArray(params.platforms);
        ok = platforms.some((p) => worker.platforms.includes(p));
        if (!ok) reason = `Platform must be one of: ${platforms.join(", ")}`;
      }
      break;
    }
    case "organization": {
      if (op === "verified_business_required") {
        ok = worker.organizationIds.length > 0;
        if (!ok) reason = "Verified organization membership required";
      }
      break;
    }
    case "time":
      // Time windows evaluated at claim time against server clock later.
      ok = true;
      break;
    default:
      ok = true;
  }

  if (ok) return null;
  return { constraintId: id, reason, enforcement };
}

/**
 * Also apply campaign country/language/device scopes as hard filters.
 */
export function evaluateWorkerEligibility(params: {
  constraints: readonly TemplateConstraint[];
  worker: WorkerEligibilityContext;
  countryScope?: readonly string[];
  languageScope?: readonly string[];
  deviceScope?: readonly string[];
}): EligibilityEvaluation {
  const hardFailures: EligibilityFailure[] = [];
  const softWarnings: EligibilityFailure[] = [];

  if (params.countryScope?.length) {
    if (
      !params.worker.countryCode ||
      !params.countryScope.includes(params.worker.countryCode)
    ) {
      hardFailures.push({
        constraintId: "campaign.country_scope",
        reason: `Country must be one of: ${params.countryScope.join(", ")}`,
        enforcement: "hard",
      });
    }
  }

  if (params.languageScope?.length) {
    const ok = params.languageScope.some((l) =>
      params.worker.languages.includes(l),
    );
    if (!ok) {
      hardFailures.push({
        constraintId: "campaign.language_scope",
        reason: `Language must intersect ${params.languageScope.join(", ")}`,
        enforcement: "hard",
      });
    }
  }

  if (params.deviceScope?.length) {
    const ok = params.deviceScope.some(
      (d) =>
        params.worker.devices.includes(d) ||
        params.worker.platforms.includes(d),
    );
    if (!ok) {
      hardFailures.push({
        constraintId: "campaign.device_scope",
        reason: `Device/platform must intersect ${params.deviceScope.join(", ")}`,
        enforcement: "hard",
      });
    }
  }

  for (const constraint of params.constraints) {
    const failure = evaluateConstraint(constraint, params.worker);
    if (!failure) continue;
    if (failure.enforcement === "hard") hardFailures.push(failure);
    else softWarnings.push(failure);
  }

  return {
    eligible: hardFailures.length === 0,
    hardFailures,
    softWarnings,
  };
}
