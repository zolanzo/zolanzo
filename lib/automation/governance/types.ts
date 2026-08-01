/**
 * Automation Governance — Phase 4.4D types.
 * Governance manages lifecycle; AutomationService executes published rules.
 */

import type {
  AutomationActionSpec,
  AutomationTriggerType,
  ConditionGroup,
} from "@/lib/automation/types";

export const AUTOMATION_GOVERNANCE_MODEL_VERSION =
  "automation-governance/1.0.0";

export const GOVERNANCE_LIFECYCLE_STATES = [
  "draft",
  "under_review",
  "approved",
  "published",
  "disabled",
  "archived",
] as const;

export type GovernanceLifecycleState =
  (typeof GOVERNANCE_LIFECYCLE_STATES)[number];

export const GOVERNANCE_ROLES = [
  "author",
  "reviewer",
  "approver",
  "administrator",
] as const;

export type GovernanceRole = (typeof GOVERNANCE_ROLES)[number];

export const AUDIT_EVENT_TYPES = [
  "created",
  "edited",
  "submitted_for_review",
  "reviewed",
  "approved",
  "rejected",
  "published",
  "disabled",
  "archived",
  "rolled_back",
  "deleted",
  "policy_violation",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export type RuleContentSnapshot = {
  name: string;
  description: string;
  trigger: AutomationTriggerType;
  conditions: ConditionGroup | null;
  actions: AutomationActionSpec[];
  dryRun: boolean;
  priority: number;
  permissions: string[];
};

export type GovernedRuleVersion = {
  id: string;
  versionNumber: number;
  content: RuleContentSnapshot;
  createdAt: string;
  createdBy: string;
  publishedAt: string | null;
  note: string | null;
};

export type GovernedRule = {
  id: string;
  publicId: string;
  organizationId: string | null;
  /** Bound AutomationService rule id (created on first publish) */
  engineRuleId: string | null;
  lifecycle: GovernanceLifecycleState;
  content: RuleContentSnapshot;
  activeVersionNumber: number | null;
  latestVersionNumber: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  softDeleted: boolean;
  simulationCompleted: boolean;
  pendingApproverIds: string[];
  approvedBy: string[];
};

export type ApprovalRequest = {
  id: string;
  governedRuleId: string;
  versionNumber: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedBy: string;
  requestedAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  comment: string | null;
};

export type AuditEvent = {
  id: string;
  governedRuleId: string;
  type: AuditEventType;
  actorId: string;
  actorRole: GovernanceRole | "system";
  versionNumber: number | null;
  correlationId: string;
  message: string;
  detail: Record<string, unknown>;
  createdAt: string;
};

export type GovernancePolicy = {
  organizationId: string | null;
  approvalRequired: boolean;
  minApprovals: number;
  mandatorySimulationBeforePublish: boolean;
  maxActionsPerRule: number;
  maxTimeoutMs: number;
  restrictedTriggers: AutomationTriggerType[];
  restrictedActions: string[];
};

export type PolicyViolation = {
  code:
    | "max_actions"
    | "restricted_trigger"
    | "restricted_action"
    | "approval_required"
    | "mandatory_simulation"
    | "max_timeout"
    | "invalid_lifecycle";
  message: string;
  severity: "error" | "warning";
};

export type PolicyValidationResult = {
  ok: boolean;
  violations: PolicyViolation[];
};

export type ChangeReviewDiff = {
  summary: string[];
  triggerChanged: boolean;
  triggerFrom: string | null;
  triggerTo: string | null;
  conditionChanges: string[];
  actionChanges: string[];
  permissionImpact: string[];
  riskIndicators: string[];
};

export type GovernanceHealthCounters = {
  draftRules: number;
  underReview: number;
  pendingApprovals: number;
  publishedVersions: number;
  rollbacks: number;
  auditEvents: number;
  policyViolations: number;
  disabledRules: number;
  archivedRules: number;
};
