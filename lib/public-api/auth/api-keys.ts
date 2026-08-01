/**
 * API key store — hashed secrets, scoped principals.
 */

import { createHash, randomBytes } from "node:crypto";
import type { PublicApiScope, PublicPrincipal } from "@/lib/public-api/types";
import { PUBLIC_API_SCOPES } from "@/lib/public-api/types";
import { setPublicApiCredentialCounts } from "@/lib/public-api/telemetry";

export type ApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  secretHash: string;
  organizationId: string | null;
  userId: string | null;
  scopes: PublicApiScope[];
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

const keys = new Map<string, ApiKeyRecord>();
let seq = 0;

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function syncCounts(): void {
  setPublicApiCredentialCounts({
    apiKeys: [...keys.values()].filter((k) => !k.revokedAt).length,
    oauthClients: 0, // updated by oauth module
  });
}

export function resetApiKeyStoreForTests(): void {
  keys.clear();
  seq = 0;
  syncCounts();
}

export function createApiKey(input: {
  name: string;
  organizationId?: string | null;
  userId?: string | null;
  scopes?: PublicApiScope[];
}): { record: ApiKeyRecord; secret: string } {
  seq += 1;
  const secret = `zk_live_${randomBytes(24).toString("base64url")}`;
  const record: ApiKeyRecord = {
    id: `apk_${seq.toString(36)}`,
    name: input.name,
    keyPrefix: secret.slice(0, 12),
    secretHash: hashSecret(secret),
    organizationId: input.organizationId ?? null,
    userId: input.userId ?? null,
    scopes: input.scopes?.length ? input.scopes : [...PUBLIC_API_SCOPES],
    createdAt: new Date().toISOString(),
    revokedAt: null,
    lastUsedAt: null,
  };
  keys.set(record.id, record);
  syncCounts();
  return { record, secret };
}

export function revokeApiKey(id: string): boolean {
  const existing = keys.get(id);
  if (!existing || existing.revokedAt) return false;
  existing.revokedAt = new Date().toISOString();
  syncCounts();
  return true;
}

export function resolveApiKey(secret: string): PublicPrincipal | null {
  const hash = hashSecret(secret);
  for (const record of keys.values()) {
    if (record.revokedAt) continue;
    if (record.secretHash !== hash) continue;
    record.lastUsedAt = new Date().toISOString();
    return {
      id: `principal:api_key:${record.id}`,
      kind: "api_key",
      displayName: record.name,
      organizationId: record.organizationId,
      scopes: record.scopes,
      userId: record.userId,
      clientId: null,
      apiKeyId: record.id,
    };
  }
  return null;
}

export function listApiKeys(): ApiKeyRecord[] {
  return [...keys.values()].map((k) => ({
    ...k,
    secretHash: "[redacted]",
  }));
}

export function countActiveApiKeys(): number {
  return [...keys.values()].filter((k) => !k.revokedAt).length;
}
