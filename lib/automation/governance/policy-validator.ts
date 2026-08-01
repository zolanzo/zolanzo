/**
 * PolicyValidator — governance policies before publication.
 */

import { AUTOMATION_ACTION_TIMEOUT_MS } from "@/lib/automation/config";
import { getActionCatalogEntry } from "@/lib/automation/builder/action-builder";
import { getPolicy } from "@/lib/automation/governance/store";
import { bumpGovernanceCounter } from "@/lib/automation/governance/telemetry";
import type {
  GovernedRule,
  GovernancePolicy,
  PolicyValidationResult,
  PolicyViolation,
  RuleContentSnapshot,
} from "@/lib/automation/governance/types";

export function validateAgainstPolicy(params: {
  content: RuleContentSnapshot;
  rule?: GovernedRule;
  policy?: GovernancePolicy;
  forPublish?: boolean;
}): PolicyValidationResult {
  const policy =
    params.policy ??
    getPolicy(params.rule?.organizationId ?? null);
  const violations: PolicyViolation[] = [];
  const content = params.content;

  if (content.actions.length > policy.maxActionsPerRule) {
    violations.push({
      code: "max_actions",
      severity: "error",
      message: `Rule has ${content.actions.length} actions; max is ${policy.maxActionsPerRule}`,
    });
  }

  if (policy.restrictedTriggers.includes(content.trigger)) {
    violations.push({
      code: "restricted_trigger",
      severity: "error",
      message: `Trigger ${content.trigger} is restricted by policy`,
    });
  }

  for (const action of content.actions) {
    if (policy.restrictedActions.includes(action.type)) {
      violations.push({
        code: "restricted_action",
        severity: "error",
        message: `Action ${action.type} is restricted by policy`,
      });
    }
    const entry = getActionCatalogEntry(action.type);
    const timeout = entry?.timeoutMs ?? AUTOMATION_ACTION_TIMEOUT_MS;
    if (timeout > policy.maxTimeoutMs) {
      violations.push({
        code: "max_timeout",
        severity: "error",
        message: `Action ${action.type} timeout ${timeout}ms exceeds policy max ${policy.maxTimeoutMs}ms`,
      });
    }
  }

  if (params.forPublish) {
    if (policy.approvalRequired) {
      const approvals = params.rule?.approvedBy.length ?? 0;
      if (approvals < policy.minApprovals) {
        violations.push({
          code: "approval_required",
          severity: "error",
          message: `Requires ${policy.minApprovals} approval(s); have ${approvals}`,
        });
      }
    }
    if (
      policy.mandatorySimulationBeforePublish &&
      !params.rule?.simulationCompleted
    ) {
      violations.push({
        code: "mandatory_simulation",
        severity: "error",
        message: "Mandatory dry-run simulation required before publish",
      });
    }
    if (
      params.rule &&
      params.rule.lifecycle !== "approved" &&
      params.rule.lifecycle !== "disabled"
    ) {
      // republish from disabled is allowed via lifecycle; first publish needs approved
      if (params.rule.lifecycle !== "published") {
        violations.push({
          code: "invalid_lifecycle",
          severity: "error",
          message: `Cannot publish from lifecycle state ${params.rule.lifecycle}`,
        });
      }
    }
  }

  const ok = !violations.some((v) => v.severity === "error");
  if (!ok) bumpGovernanceCounter("policyViolations");
  return { ok, violations };
}

export const PolicyValidator = {
  validate: validateAgainstPolicy,
};
