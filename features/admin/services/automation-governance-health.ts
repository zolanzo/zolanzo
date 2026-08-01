/**
 * Admin Automation Governance Health — lifecycle observability (4.4D).
 */

import "server-only";

import { getGovernanceHealth } from "@/lib/automation/governance/governance-service";

export type AutomationGovernanceHealthSnapshot = {
  governanceEnabled: boolean;
  approvalsEnabled: boolean;
  auditEnabled: boolean;
  modelVersion: string;
  draftRules: number;
  underReview: number;
  pendingApprovals: number;
  publishedVersions: number;
  rollbacks: number;
  auditEvents: number;
  policyViolations: number;
  disabledRules: number;
  archivedRules: number;
  generatedAt: string;
};

export async function getAutomationGovernanceHealthSnapshot(): Promise<AutomationGovernanceHealthSnapshot> {
  const health = getGovernanceHealth();
  return {
    governanceEnabled: health.governanceEnabled,
    approvalsEnabled: health.approvalsEnabled,
    auditEnabled: health.auditEnabled,
    modelVersion: health.modelVersion,
    draftRules: health.draftRules,
    underReview: health.underReview,
    pendingApprovals: health.pendingApprovals,
    publishedVersions: health.publishedVersions,
    rollbacks: health.rollbacks,
    auditEvents: health.auditEvents,
    policyViolations: health.policyViolations,
    disabledRules: health.disabledRules,
    archivedRules: health.archivedRules,
    generatedAt: new Date().toISOString(),
  };
}
