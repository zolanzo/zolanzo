/**
 * In-memory install store for Automation Library templates.
 */

import type { InstalledTemplateRecord } from "@/lib/automation/library/types";

let seq = 0;
const installs = new Map<string, InstalledTemplateRecord>();

function nextId(): string {
  seq += 1;
  return `atpl_${seq.toString(36)}`;
}

export function resetLibraryInstallStoreForTests(): void {
  seq = 0;
  installs.clear();
}

export function saveInstall(
  record: Omit<InstalledTemplateRecord, "id" | "installedAt"> & {
    id?: string;
    installedAt?: string;
  },
): InstalledTemplateRecord {
  const full: InstalledTemplateRecord = {
    id: record.id ?? nextId(),
    templateId: record.templateId,
    templateVersion: record.templateVersion,
    ruleId: record.ruleId,
    rulePublicId: record.rulePublicId,
    organizationId: record.organizationId,
    parameters: record.parameters,
    installedAt: record.installedAt ?? new Date().toISOString(),
    active: record.active,
  };
  installs.set(full.id, full);
  return full;
}

export function getInstall(id: string): InstalledTemplateRecord | null {
  return installs.get(id) ?? null;
}

export function listInstalls(filter?: {
  organizationId?: string | null;
  templateId?: string;
  active?: boolean;
}): InstalledTemplateRecord[] {
  let items = [...installs.values()];
  if (filter?.organizationId !== undefined) {
    items = items.filter((i) => i.organizationId === filter.organizationId);
  }
  if (filter?.templateId) {
    items = items.filter((i) => i.templateId === filter.templateId);
  }
  if (filter?.active != null) {
    items = items.filter((i) => i.active === filter.active);
  }
  return items.sort((a, b) => b.installedAt.localeCompare(a.installedAt));
}

export function setInstallActive(
  id: string,
  active: boolean,
): InstalledTemplateRecord | null {
  const existing = installs.get(id);
  if (!existing) return null;
  const next = { ...existing, active };
  installs.set(id, next);
  return next;
}

export function removeInstall(id: string): boolean {
  return installs.delete(id);
}

export function countInstalls(activeOnly = false): number {
  if (!activeOnly) return installs.size;
  return [...installs.values()].filter((i) => i.active).length;
}
