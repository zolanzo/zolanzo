/**
 * Automation Library — Phase 4.4B types.
 * Templates compose 4.4A triggers/conditions/actions only.
 */

import type {
  AutomationActionSpec,
  AutomationTriggerType,
  ConditionGroup,
} from "@/lib/automation/types";

export const AUTOMATION_LIBRARY_MODEL_VERSION = "automation-library/1.0.0";

export const AUTOMATION_LIBRARY_CATEGORIES = [
  "operations",
  "campaigns",
  "workers",
  "organizations",
  "trust",
  "analytics",
] as const;

export type AutomationLibraryCategory =
  (typeof AUTOMATION_LIBRARY_CATEGORIES)[number];

export type TemplateParameter = {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "enum";
  required?: boolean;
  defaultValue?: string | number | boolean;
  enumValues?: string[];
  description?: string;
};

export type AutomationTemplate = {
  id: string;
  name: string;
  description: string;
  category: AutomationLibraryCategory;
  trigger: AutomationTriggerType;
  /** Condition tree; parameter placeholders use `{{paramKey}}` in string values. */
  conditions: ConditionGroup | null;
  actions: AutomationActionSpec[];
  parameters: TemplateParameter[];
  permissions: string[];
  version: string;
  enabledByDefault: boolean;
  priority: number;
};

export type InstallTemplateInput = {
  templateId: string;
  organizationId?: string | null;
  parameters?: Record<string, string | number | boolean>;
  enabled?: boolean;
  dryRun?: boolean;
  nameOverride?: string;
};

export type InstalledTemplateRecord = {
  id: string;
  templateId: string;
  templateVersion: string;
  ruleId: string;
  rulePublicId: string;
  organizationId: string | null;
  parameters: Record<string, string | number | boolean>;
  installedAt: string;
  active: boolean;
};

export type TemplateValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export type LibraryHealthCounters = {
  installs: number;
  uninstalls: number;
  validationFailures: number;
  generationFailures: number;
  byTemplate: Record<string, number>;
  byCategory: Record<string, number>;
};
