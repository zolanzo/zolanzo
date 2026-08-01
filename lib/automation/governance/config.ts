/**
 * Automation Governance runtime flags — Phase 4.4D.
 */

function truthy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

function falsy(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off" || v === "no";
}

import { isAutomationEngineEnabled } from "@/lib/automation/config";

/** Master governance switch. Default: on when automation engine on. */
export function isAutomationGovernanceEnabled(): boolean {
  if (!isAutomationEngineEnabled()) return false;
  if (falsy(process.env.AUTOMATION_GOVERNANCE)) return false;
  if (truthy(process.env.AUTOMATION_GOVERNANCE)) return true;
  return true;
}

/** Approval workflows. Default: on when governance on. */
export function isAutomationApprovalsEnabled(): boolean {
  if (!isAutomationGovernanceEnabled()) return false;
  if (falsy(process.env.AUTOMATION_APPROVALS)) return false;
  if (truthy(process.env.AUTOMATION_APPROVALS)) return true;
  return true;
}

/** Audit trail recording. Default: on when governance on. */
export function isAutomationAuditEnabled(): boolean {
  if (!isAutomationGovernanceEnabled()) return false;
  if (falsy(process.env.AUTOMATION_AUDIT)) return false;
  if (truthy(process.env.AUTOMATION_AUDIT)) return true;
  return true;
}

export { AUTOMATION_GOVERNANCE_MODEL_VERSION } from "@/lib/automation/governance/types";
