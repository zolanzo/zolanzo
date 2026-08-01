/**
 * OAuth 2.1 foundation — client credentials for machine clients.
 */

import { createHash, randomBytes } from "node:crypto";
import type { PublicApiScope, PublicPrincipal } from "@/lib/public-api/types";
import { PUBLIC_API_SCOPES } from "@/lib/public-api/types";
import { setPublicApiCredentialCounts } from "@/lib/public-api/telemetry";
import { countActiveApiKeys } from "@/lib/public-api/auth/api-keys";

export type OAuthClientRecord = {
  id: string;
  clientId: string;
  clientSecretHash: string;
  name: string;
  organizationId: string | null;
  scopes: PublicApiScope[];
  createdAt: string;
  revokedAt: string | null;
};

type AccessTokenRecord = {
  tokenHash: string;
  clientId: string;
  scopes: PublicApiScope[];
  expiresAt: number;
  organizationId: string | null;
};

const clients = new Map<string, OAuthClientRecord>();
const tokens = new Map<string, AccessTokenRecord>();
let seq = 0;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function syncCounts(): void {
  setPublicApiCredentialCounts({
    apiKeys: countActiveApiKeys(),
    oauthClients: [...clients.values()].filter((c) => !c.revokedAt).length,
  });
}

export function resetOAuthStoreForTests(): void {
  clients.clear();
  tokens.clear();
  seq = 0;
  syncCounts();
}

export function createOAuthClient(input: {
  name: string;
  organizationId?: string | null;
  scopes?: PublicApiScope[];
}): { client: OAuthClientRecord; clientSecret: string } {
  seq += 1;
  const clientId = `zoc_${randomBytes(8).toString("hex")}`;
  const clientSecret = `zos_${randomBytes(24).toString("base64url")}`;
  const client: OAuthClientRecord = {
    id: `oauth_${seq.toString(36)}`,
    clientId,
    clientSecretHash: hash(clientSecret),
    name: input.name,
    organizationId: input.organizationId ?? null,
    scopes: input.scopes?.length ? input.scopes : [...PUBLIC_API_SCOPES],
    createdAt: new Date().toISOString(),
    revokedAt: null,
  };
  clients.set(client.id, client);
  syncCounts();
  return { client, clientSecret };
}

export function issueClientCredentialsToken(input: {
  clientId: string;
  clientSecret: string;
  scope?: string;
}): { accessToken: string; tokenType: "Bearer"; expiresIn: number } | null {
  const client = [...clients.values()].find(
    (c) => c.clientId === input.clientId && !c.revokedAt,
  );
  if (!client) return null;
  if (client.clientSecretHash !== hash(input.clientSecret)) return null;

  let scopes = client.scopes;
  if (input.scope?.trim()) {
    const requested = input.scope
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean) as PublicApiScope[];
    scopes = requested.filter((s) => client.scopes.includes(s));
    if (!scopes.length) return null;
  }

  const accessToken = `zoa_${randomBytes(32).toString("base64url")}`;
  const expiresIn = 3600;
  tokens.set(hash(accessToken), {
    tokenHash: hash(accessToken),
    clientId: client.clientId,
    scopes,
    expiresAt: Date.now() + expiresIn * 1000,
    organizationId: client.organizationId,
  });
  return { accessToken, tokenType: "Bearer", expiresIn };
}

export function resolveBearerToken(token: string): PublicPrincipal | null {
  const record = tokens.get(hash(token));
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    tokens.delete(hash(token));
    return null;
  }
  const client = [...clients.values()].find(
    (c) => c.clientId === record.clientId && !c.revokedAt,
  );
  if (!client) return null;
  return {
    id: `principal:oauth:${client.id}`,
    kind: "oauth_client",
    displayName: client.name,
    organizationId: record.organizationId,
    scopes: record.scopes,
    userId: null,
    clientId: client.clientId,
    apiKeyId: null,
  };
}

export function countActiveOAuthClients(): number {
  return [...clients.values()].filter((c) => !c.revokedAt).length;
}

export function listOAuthClients(): Array<Omit<OAuthClientRecord, "clientSecretHash">> {
  return [...clients.values()].map(({ clientSecretHash: _, ...rest }) => rest);
}
