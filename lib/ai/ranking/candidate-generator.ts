/**
 * CandidateGenerator — who *can* be considered (no AI).
 * Pure functions over a worker pool + campaign scopes.
 */

import type {
  MatchCampaignContext,
  WorkerMatchSignals,
} from "@/lib/ai/ranking/match-types";

export type CandidateGeneratorInput = {
  campaign: MatchCampaignContext;
  pool: WorkerMatchSignals[];
  /** Optional explicit allow-list (user ids) */
  candidateWorkerIds?: string[];
};

export type CandidateGeneratorResult = {
  candidates: WorkerMatchSignals[];
  rejected: Array<{ workerId: string; reason: string }>;
};

/**
 * Produce candidates using hard campaign scopes only (skills/region/language/status).
 * Full eligibility constraints run in EligibilityFilter.
 */
export function generateCandidates(
  input: CandidateGeneratorInput,
): CandidateGeneratorResult {
  const rejected: Array<{ workerId: string; reason: string }> = [];
  const allow = input.candidateWorkerIds
    ? new Set(input.candidateWorkerIds)
    : null;

  const candidates: WorkerMatchSignals[] = [];

  for (const worker of input.pool) {
    if (allow && !allow.has(worker.workerId)) {
      rejected.push({ workerId: worker.workerId, reason: "not_in_candidate_list" });
      continue;
    }

    if (input.campaign.countryScope.length > 0) {
      if (
        !worker.countryCode ||
        !input.campaign.countryScope.includes(worker.countryCode)
      ) {
        rejected.push({
          workerId: worker.workerId,
          reason: "country_scope",
        });
        continue;
      }
    }

    if (input.campaign.languageScope.length > 0) {
      const ok = input.campaign.languageScope.some((l) =>
        worker.languages.includes(l),
      );
      if (!ok) {
        rejected.push({
          workerId: worker.workerId,
          reason: "language_scope",
        });
        continue;
      }
    }

    if (input.campaign.requiredSkills.length > 0) {
      const ok = input.campaign.requiredSkills.some((s) =>
        worker.skills.includes(s),
      );
      if (!ok && worker.skills.length > 0) {
        rejected.push({
          workerId: worker.workerId,
          reason: "required_skills",
        });
        continue;
      }
      // Unknown skills (empty) → keep for soft eligibility later
    }

    if (input.campaign.deviceScope.length > 0 && worker.platforms.length > 0) {
      const ok = input.campaign.deviceScope.some((d) =>
        worker.platforms.includes(d),
      );
      if (!ok) {
        rejected.push({
          workerId: worker.workerId,
          reason: "device_scope",
        });
        continue;
      }
    }

    candidates.push(worker);
  }

  return { candidates, rejected };
}
