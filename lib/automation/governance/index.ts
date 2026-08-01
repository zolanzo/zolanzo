/**
 * Automation Governance — Phase 4.4D exports.
 */

export {
  AUTOMATION_GOVERNANCE_MODEL_VERSION,
  GOVERNANCE_LIFECYCLE_STATES,
  GOVERNANCE_ROLES,
  AUDIT_EVENT_TYPES,
  type GovernanceLifecycleState,
  type GovernanceRole,
  type GovernedRule,
  type GovernedRuleVersion,
  type RuleContentSnapshot,
  type ApprovalRequest,
  type AuditEvent,
  type GovernancePolicy,
  type ChangeReviewDiff,
  type PolicyValidationResult,
} from "@/lib/automation/governance/types";

export {
  isAutomationGovernanceEnabled,
  isAutomationApprovalsEnabled,
  isAutomationAuditEnabled,
} from "@/lib/automation/governance/config";

export { LifecycleManager } from "@/lib/automation/governance/lifecycle-manager";
export { ApprovalEngine } from "@/lib/automation/governance/approval-engine";
export { VersionManager } from "@/lib/automation/governance/version-manager";
export { PolicyValidator } from "@/lib/automation/governance/policy-validator";
export { AuditService } from "@/lib/automation/governance/audit-service";
export { RollbackService } from "@/lib/automation/governance/rollback-service";

export {
  GovernanceService,
  getGovernanceHealth,
} from "@/lib/automation/governance/governance-service";

export {
  getGovernanceTelemetrySnapshot,
  resetGovernanceTelemetryForTests,
} from "@/lib/automation/governance/telemetry";

export { resetGovernanceStoreForTests } from "@/lib/automation/governance/store";
