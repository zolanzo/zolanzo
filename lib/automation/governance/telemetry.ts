/**
 * Automation Governance telemetry.
 */

import type { GovernanceHealthCounters } from "@/lib/automation/governance/types";

const counters: GovernanceHealthCounters = {
  draftRules: 0,
  underReview: 0,
  pendingApprovals: 0,
  publishedVersions: 0,
  rollbacks: 0,
  auditEvents: 0,
  policyViolations: 0,
  disabledRules: 0,
  archivedRules: 0,
};

export function setGovernanceHealthSnapshot(
  next: Partial<GovernanceHealthCounters>,
): void {
  Object.assign(counters, next);
}

export function bumpGovernanceCounter(
  key: keyof GovernanceHealthCounters,
  by = 1,
): void {
  counters[key] += by;
}

export function getGovernanceTelemetrySnapshot(): GovernanceHealthCounters {
  return { ...counters };
}

export function resetGovernanceTelemetryForTests(): void {
  counters.draftRules = 0;
  counters.underReview = 0;
  counters.pendingApprovals = 0;
  counters.publishedVersions = 0;
  counters.rollbacks = 0;
  counters.auditEvents = 0;
  counters.policyViolations = 0;
  counters.disabledRules = 0;
  counters.archivedRules = 0;
}
