/**
 * In-memory marketplace store — installations + credentials.
 */

import type {
  ConnectorInstallation,
  StoredCredential,
} from "@/lib/marketplace/types";

let seq = 0;
const installations = new Map<string, ConnectorInstallation>();
const credentials = new Map<string, StoredCredential>();
/** Plaintext secrets remembered after create/rotate for runtime (tests / delivery) */
const plaintext = new Map<string, string>();

function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

function nextPublicId(prefix: string): string {
  seq += 1;
  const body = seq.toString(36).toUpperCase().padStart(6, "2").slice(-6);
  return `${prefix}-${body}`;
}

export function resetMarketplaceStoreForTests(): void {
  seq = 0;
  installations.clear();
  credentials.clear();
  plaintext.clear();
}

export function allocateMarketplaceIds() {
  return {
    installationId: nextId("inst"),
    publicId: nextPublicId("INT"),
    credentialId: nextId("cred"),
  };
}

export function saveInstallation(
  row: ConnectorInstallation,
): ConnectorInstallation {
  installations.set(row.id, row);
  return row;
}

export function getInstallation(id: string): ConnectorInstallation | null {
  return installations.get(id) ?? null;
}

export function deleteInstallation(id: string): boolean {
  for (const [cid, c] of credentials) {
    if (c.installationId === id) {
      credentials.delete(cid);
      plaintext.delete(cid);
    }
  }
  return installations.delete(id);
}

export function listInstallations(filter?: {
  organizationId?: string;
  connectorId?: string;
  enabled?: boolean;
}): ConnectorInstallation[] {
  let rows = [...installations.values()].filter(
    (i) => i.lifecycle !== "uninstalled",
  );
  if (filter?.organizationId) {
    rows = rows.filter((i) => i.organizationId === filter.organizationId);
  }
  if (filter?.connectorId) {
    rows = rows.filter((i) => i.connectorId === filter.connectorId);
  }
  if (filter?.enabled != null) {
    rows = rows.filter((i) => i.enabled === filter.enabled);
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveCredential(cred: StoredCredential): void {
  credentials.set(cred.id, cred);
}

export function listCredentials(installationId: string): StoredCredential[] {
  return [...credentials.values()].filter(
    (c) => c.installationId === installationId && !c.revokedAt,
  );
}

export function getCredential(id: string): StoredCredential | null {
  return credentials.get(id) ?? null;
}

export function rememberPlaintext(credentialId: string, secret: string): void {
  plaintext.set(credentialId, secret);
}

export function getPlaintext(credentialId: string): string | null {
  return plaintext.get(credentialId) ?? null;
}

export { nextId, nextPublicId };
