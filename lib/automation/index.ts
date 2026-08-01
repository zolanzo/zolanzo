/**
 * Workflow Automation Foundation — Phase 4.4A exports.
 */

export {
  AUTOMATION_ENGINE_MODEL_VERSION,
  AUTOMATION_TRIGGERS,
  AUTOMATION_ACTION_TYPES,
  CONDITION_OPERATORS,
  type AutomationTriggerType,
  type AutomationActionType,
  type ConditionAtom,
  type ConditionGroup,
  type AutomationRule,
  type AutomationEvent,
  type AutomationExecutionRecord,
  type CreateAutomationRuleInput,
  type ActionExecutionResult,
} from "@/lib/automation/types";

export {
  isAutomationEngineEnabled,
  isAutomationRulesEnabled,
  isAutomationActionsEnabled,
} from "@/lib/automation/config";

export {
  AutomationService,
  createAutomationRule,
  ingestAutomationEvent,
  listAutomationRules,
} from "@/lib/automation/automation-service";

export { AutomationEngine, processAutomationEvent } from "@/lib/automation/automation-engine";

export { TriggerRegistry, listTriggers } from "@/lib/automation/trigger-registry";

export { RuleEngine, selectMatchingRules } from "@/lib/automation/rule-engine";

export {
  ConditionEvaluator,
  evaluateConditionGroup,
} from "@/lib/automation/condition-evaluator";

export { ActionRegistry, listActions, executeAction } from "@/lib/automation/action-registry";

export { ExecutionLog, getExecutionHistory } from "@/lib/automation/execution-log";

export {
  AutomationScheduler,
  runAutomationScheduler,
} from "@/lib/automation/automation-scheduler";

export {
  getAutomationTelemetrySnapshot,
  resetAutomationTelemetryForTests,
} from "@/lib/automation/telemetry";

export { resetAutomationStoreForTests } from "@/lib/automation/store";

/** Phase 4.4B — Automation Library */
export {
  AUTOMATION_LIBRARY_MODEL_VERSION,
  AUTOMATION_LIBRARY_CATEGORIES,
  isAutomationLibraryEnabled,
  isAutomationTemplatesEnabled,
  AutomationLibraryService,
  CategoryRegistry,
  TemplateRegistry,
  TemplateValidator,
  RuleGenerator,
  listLibraryTemplates,
  installTemplate,
  getLibraryHealth,
  STARTER_TEMPLATES,
  resetLibraryInstallStoreForTests,
  resetLibraryTelemetryForTests,
  type AutomationTemplate,
  type AutomationLibraryCategory,
  type InstallTemplateInput,
  type InstalledTemplateRecord,
} from "@/lib/automation/library";

/** Phase 4.4C — Visual Rule Builder */
export {
  AUTOMATION_BUILDER_MODEL_VERSION,
  BUILDER_TRIGGER_CATEGORIES,
  isAutomationBuilderEnabled,
  isAutomationSimulationEnabled,
  isAutomationImportExportEnabled,
  RuleBuilderService,
  TriggerPicker,
  ConditionBuilder,
  ActionBuilder,
  RuleValidator,
  RulePreview,
  SimulationEngine,
  RuleSerializer,
  createEmptyDraft,
  createRuleFromDraft,
  prefillFromTemplate,
  getBuilderHealth,
  resetBuilderTelemetryForTests,
  type RuleDraft,
  type BuilderValidationResult,
  type RulePreviewModel,
  type SimulationResult,
} from "@/lib/automation/builder";

/** Phase 4.4D — Automation Governance */
export {
  AUTOMATION_GOVERNANCE_MODEL_VERSION,
  GOVERNANCE_LIFECYCLE_STATES,
  GOVERNANCE_ROLES,
  isAutomationGovernanceEnabled,
  isAutomationApprovalsEnabled,
  isAutomationAuditEnabled,
  GovernanceService,
  LifecycleManager,
  ApprovalEngine,
  VersionManager,
  PolicyValidator,
  AuditService,
  RollbackService,
  getGovernanceHealth,
  resetGovernanceStoreForTests,
  resetGovernanceTelemetryForTests,
  type GovernedRule,
  type GovernanceRole,
  type RuleContentSnapshot,
  type GovernancePolicy,
  type ChangeReviewDiff,
} from "@/lib/automation/governance";
