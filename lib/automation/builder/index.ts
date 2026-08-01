/**
 * Visual Rule Builder — Phase 4.4C exports.
 */

export {
  AUTOMATION_BUILDER_MODEL_VERSION,
  BUILDER_TRIGGER_CATEGORIES,
  type BuilderTriggerCategory,
  type RuleDraft,
  type BuilderValidationResult,
  type BuilderValidationIssue,
  type RulePreviewModel,
  type SimulationResult,
  type SerializedRuleBundle,
  type TriggerCatalogEntry,
  type ActionCatalogEntry,
} from "@/lib/automation/builder/types";

export {
  isAutomationBuilderEnabled,
  isAutomationSimulationEnabled,
  isAutomationImportExportEnabled,
} from "@/lib/automation/builder/config";

export { TriggerPicker } from "@/lib/automation/builder/trigger-picker";
export { ConditionBuilder } from "@/lib/automation/builder/condition-builder";
export { ActionBuilder } from "@/lib/automation/builder/action-builder";
export { RuleValidator } from "@/lib/automation/builder/rule-validator";
export { RulePreview } from "@/lib/automation/builder/rule-preview";
export { SimulationEngine } from "@/lib/automation/builder/simulation-engine";
export { RuleSerializer } from "@/lib/automation/builder/rule-serializer";

export {
  RuleBuilderService,
  createEmptyDraft,
  createRuleFromDraft,
  prefillFromTemplate,
  getBuilderHealth,
} from "@/lib/automation/builder/builder-service";

export {
  getBuilderTelemetrySnapshot,
  resetBuilderTelemetryForTests,
} from "@/lib/automation/builder/telemetry";
