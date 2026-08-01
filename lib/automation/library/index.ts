/**
 * Automation Library — Phase 4.4B exports.
 */

export {
  AUTOMATION_LIBRARY_MODEL_VERSION,
  AUTOMATION_LIBRARY_CATEGORIES,
  type AutomationLibraryCategory,
  type AutomationTemplate,
  type InstallTemplateInput,
  type InstalledTemplateRecord,
  type TemplateParameter,
  type TemplateValidationResult,
} from "@/lib/automation/library/types";

export {
  isAutomationLibraryEnabled,
  isAutomationTemplatesEnabled,
} from "@/lib/automation/library/config";

export { CategoryRegistry, listCategories } from "@/lib/automation/library/category-registry";

export {
  TemplateRegistry,
  listTemplates,
  getTemplate,
} from "@/lib/automation/library/template-registry";

export { TemplateValidator, validateTemplate } from "@/lib/automation/library/template-validator";

export { RuleGenerator, generateRuleInput } from "@/lib/automation/library/rule-generator";

export {
  AutomationLibraryService,
  installTemplate,
  listLibraryTemplates,
  getLibraryHealth,
} from "@/lib/automation/library/library-service";

export {
  getLibraryTelemetrySnapshot,
  resetLibraryTelemetryForTests,
} from "@/lib/automation/library/telemetry";

export { resetLibraryInstallStoreForTests } from "@/lib/automation/library/install-store";

export { STARTER_TEMPLATES } from "@/lib/automation/library/templates";
