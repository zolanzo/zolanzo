/**
 * EligibilityFilter — who is *allowed* (reuses marketplace evaluator).
 */

import type { TemplateConstraint } from "@/constants/constraints";
import { evaluateWorkerEligibility } from "@/features/task-marketplace/services/eligibility-evaluate";
import type { WorkerEligibilityContext } from "@/features/task-marketplace/types/worker-context";
import type {
  MatchCampaignContext,
  WorkerMatchSignals,
} from "@/lib/ai/ranking/match-types";

export type EligibilityFilterResult = {
  eligible: WorkerMatchSignals[];
  ineligible: Array<{
    workerId: string;
    hardFailures: string[];
    softWarnings: string[];
  }>;
};

function toEligibilityContext(
  worker: WorkerMatchSignals,
): WorkerEligibilityContext {
  return {
    userId: worker.workerId,
    countryCode: worker.countryCode,
    languages: worker.languages,
    skills: worker.skills,
    platforms: worker.platforms,
    devices: worker.platforms,
    trustScore: worker.trustScore,
    approvalRate: worker.approvalRate,
    completedTasks: worker.completedTasks,
    organizationIds: worker.organizationIds,
  };
}

function toConstraints(
  campaign: MatchCampaignContext,
): TemplateConstraint[] {
  return campaign.constraints.map((c) => ({
    id: c.id,
    kind: c.kind as TemplateConstraint["kind"],
    op: c.op,
    params: c.params,
    enforcement: c.enforcement,
    label: c.label,
  }));
}

export function filterEligibleWorkers(params: {
  campaign: MatchCampaignContext;
  candidates: WorkerMatchSignals[];
}): EligibilityFilterResult {
  const constraints = toConstraints(params.campaign);
  const eligible: WorkerMatchSignals[] = [];
  const ineligible: EligibilityFilterResult["ineligible"] = [];

  for (const worker of params.candidates) {
    const evaluation = evaluateWorkerEligibility({
      constraints,
      worker: toEligibilityContext(worker),
      countryScope: params.campaign.countryScope,
      languageScope: params.campaign.languageScope,
      deviceScope: params.campaign.deviceScope,
    });

    if (evaluation.eligible) {
      eligible.push(worker);
    } else {
      ineligible.push({
        workerId: worker.workerId,
        hardFailures: evaluation.hardFailures.map((f) => f.reason),
        softWarnings: evaluation.softWarnings.map((f) => f.reason),
      });
    }
  }

  return { eligible, ineligible };
}
