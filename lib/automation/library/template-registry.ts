/**
 * Template registry — source of truth for built-in automation templates.
 */

import { STARTER_TEMPLATES } from "@/lib/automation/library/templates";
import type {
  AutomationLibraryCategory,
  AutomationTemplate,
} from "@/lib/automation/library/types";
import { isKnownCategory } from "@/lib/automation/library/category-registry";

const byId = new Map<string, AutomationTemplate>();

function seed(): void {
  if (byId.size > 0) return;
  for (const t of STARTER_TEMPLATES) {
    byId.set(t.id, t);
  }
}

export function registerTemplate(template: AutomationTemplate): void {
  seed();
  byId.set(template.id, template);
}

export function getTemplate(id: string): AutomationTemplate | undefined {
  seed();
  return byId.get(id);
}

export function listTemplates(filter?: {
  category?: AutomationLibraryCategory;
  enabledByDefault?: boolean;
}): AutomationTemplate[] {
  seed();
  let items = [...byId.values()];
  if (filter?.category) {
    items = items.filter((t) => t.category === filter.category);
  }
  if (filter?.enabledByDefault != null) {
    items = items.filter(
      (t) => t.enabledByDefault === filter.enabledByDefault,
    );
  }
  return items.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export function listTemplateVersions(): Array<{
  templateId: string;
  version: string;
  category: AutomationLibraryCategory;
}> {
  return listTemplates().map((t) => ({
    templateId: t.id,
    version: t.version,
    category: t.category,
  }));
}

export function countTemplates(): number {
  seed();
  return byId.size;
}

export function resetTemplateRegistryForTests(): void {
  byId.clear();
  seed();
}

export function assertTemplateCategory(template: AutomationTemplate): boolean {
  return isKnownCategory(template.category);
}

export const TemplateRegistry = {
  register: registerTemplate,
  get: getTemplate,
  list: listTemplates,
  versions: listTemplateVersions,
  count: countTemplates,
};
