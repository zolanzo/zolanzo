/**
 * Integration Registry — catalog of connector manifests.
 */

import { STARTER_CONNECTORS } from "@/lib/marketplace/connectors";
import type {
  ConnectorCategory,
  ConnectorManifest,
} from "@/lib/marketplace/types";

const byId = new Map<string, ConnectorManifest>();

function seed(): void {
  if (byId.size > 0) return;
  for (const c of STARTER_CONNECTORS) {
    byId.set(c.id, c);
  }
}

export function registerConnector(manifest: ConnectorManifest): void {
  seed();
  byId.set(manifest.id, manifest);
}

export function getConnector(id: string): ConnectorManifest | undefined {
  seed();
  return byId.get(id);
}

export function listConnectors(filter?: {
  category?: ConnectorCategory;
}): ConnectorManifest[] {
  seed();
  let items = [...byId.values()];
  if (filter?.category) {
    items = items.filter((c) => c.category === filter.category);
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function countConnectors(): number {
  seed();
  return byId.size;
}

export function resetConnectorRegistryForTests(): void {
  byId.clear();
  seed();
}

export const IntegrationRegistry = {
  register: registerConnector,
  get: getConnector,
  list: listConnectors,
  count: countConnectors,
};
