/**
 * RollbackService — publish a previous immutable version via governance.
 * Engine sync happens through GovernanceService.publish path.
 */

import { getGovernedRule, getVersion } from "@/lib/automation/governance/store";
import { bumpGovernanceCounter } from "@/lib/automation/governance/telemetry";
import type { GovernedRule, RuleContentSnapshot } from "@/lib/automation/governance/types";

export type RollbackPlan = {
  ok: boolean;
  governedRuleId: string;
  fromVersion: number | null;
  toVersion: number;
  content?: RuleContentSnapshot;
  error?: string;
};

export function planRollback(params: {
  governedRuleId: string;
  targetVersion: number;
}): RollbackPlan {
  const rule = getGovernedRule(params.governedRuleId);
  if (!rule || rule.softDeleted) {
    return {
      ok: false,
      governedRuleId: params.governedRuleId,
      fromVersion: null,
      toVersion: params.targetVersion,
      error: "Governed rule not found",
    };
  }
  if (rule.lifecycle !== "published" && rule.lifecycle !== "disabled") {
    return {
      ok: false,
      governedRuleId: rule.id,
      fromVersion: rule.activeVersionNumber,
      toVersion: params.targetVersion,
      error: `Rollback only from published/disabled (current: ${rule.lifecycle})`,
    };
  }
  const version = getVersion(rule.id, params.targetVersion);
  if (!version) {
    return {
      ok: false,
      governedRuleId: rule.id,
      fromVersion: rule.activeVersionNumber,
      toVersion: params.targetVersion,
      error: `Version ${params.targetVersion} not found`,
    };
  }
  if (rule.activeVersionNumber === params.targetVersion) {
    return {
      ok: false,
      governedRuleId: rule.id,
      fromVersion: rule.activeVersionNumber,
      toVersion: params.targetVersion,
      error: "Target version is already active",
    };
  }
  return {
    ok: true,
    governedRuleId: rule.id,
    fromVersion: rule.activeVersionNumber,
    toVersion: params.targetVersion,
    content: structuredClone(version.content),
  };
}

export function recordRollbackTelemetry(): void {
  bumpGovernanceCounter("rollbacks");
}

export function applyContentToRule(
  rule: GovernedRule,
  content: RuleContentSnapshot,
  versionNumber: number,
): GovernedRule {
  return {
    ...rule,
    content: structuredClone(content),
    activeVersionNumber: versionNumber,
    lifecycle: "published",
    updatedAt: new Date().toISOString(),
  };
}

export const RollbackService = {
  plan: planRollback,
  applyContent: applyContentToRule,
  recordTelemetry: recordRollbackTelemetry,
};
