/**
 * In-memory + DB-backed template registry.
 * No switch statements / hardcoded template classes.
 */

import type { TaskTemplateRecord } from "@/features/task-templates/types";

type RegistryStore = {
  byPublicId: Map<string, TaskTemplateRecord>;
  byKeyVersion: Map<string, TaskTemplateRecord>;
  latestPublishedByKey: Map<string, TaskTemplateRecord>;
};

function createStore(): RegistryStore {
  return {
    byPublicId: new Map(),
    byKeyVersion: new Map(),
    latestPublishedByKey: new Map(),
  };
}

let store = createStore();

function keyVersion(templateKey: string, version: number): string {
  return `${templateKey}@${version}`;
}

export function resetTemplateRegistry(): void {
  store = createStore();
}

export function registerTemplateInRegistry(record: TaskTemplateRecord): void {
  store.byPublicId.set(record.publicId, record);
  store.byKeyVersion.set(keyVersion(record.templateKey, record.version), record);

  if (record.status === "published") {
    const current = store.latestPublishedByKey.get(record.templateKey);
    if (!current || current.version < record.version) {
      store.latestPublishedByKey.set(record.templateKey, record);
    }
  }
}

export function getTemplateByPublicId(
  publicId: string,
): TaskTemplateRecord | undefined {
  return store.byPublicId.get(publicId);
}

export function getTemplateVersion(
  templateKey: string,
  version: number,
): TaskTemplateRecord | undefined {
  return store.byKeyVersion.get(keyVersion(templateKey, version));
}

export function getLatestPublishedTemplate(
  templateKey: string,
): TaskTemplateRecord | undefined {
  return store.latestPublishedByKey.get(templateKey);
}

export function listRegisteredTemplates(filter?: {
  status?: TaskTemplateRecord["status"];
  category?: string;
}): TaskTemplateRecord[] {
  const all = [...store.byPublicId.values()];
  return all.filter((t) => {
    if (filter?.status && t.status !== filter.status) return false;
    if (filter?.category && t.category !== filter.category) return false;
    return true;
  });
}

export function hydrateRegistry(records: readonly TaskTemplateRecord[]): void {
  resetTemplateRegistry();
  for (const record of records) {
    registerTemplateInRegistry(record);
  }
}
