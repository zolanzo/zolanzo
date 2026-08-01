/**
 * Personal Access Tokens — optional internal principal mode.
 */

import { createHash, randomBytes } from "node:crypto";
import type { PublicApiScope, PublicPrincipal } from "@/lib/public-api/types";
import { PUBLIC_API_SCOPES } from "@/lib/public-api/types";

type PatRecord = {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  scopes: PublicApiScope[];
  organizationId: string | null;
  createdAt: string;
  revokedAt: string | null;
};

const pats = new Map<string, PatRecord>();
let seq = 0;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function resetPatStoreForTests(): void {
  pats.clear();
  seq = 0;
}

export function createPersonalAccessToken(input: {
  userId: string;
  name: string;
  organizationId?: string | null;
  scopes?: PublicApiScope[];
}): { token: string; id: string } {
  seq += 1;
  const token = `zpat_${randomBytes(24).toString("base64url")}`;
  const id = `pat_${seq.toString(36)}`;
  pats.set(id, {
    id,
    userId: input.userId,
    name: input.name,
    tokenHash: hash(token),
    scopes: input.scopes?.length ? input.scopes : [...PUBLIC_API_SCOPES],
    organizationId: input.organizationId ?? null,
    createdAt: new Date().toISOString(),
    revokedAt: null,
  });
  return { token, id };
}

export function resolvePersonalAccessToken(
  token: string,
): PublicPrincipal | null {
  const h = hash(token);
  for (const record of pats.values()) {
    if (record.revokedAt) continue;
    if (record.tokenHash !== h) continue;
    return {
      id: `principal:pat:${record.id}`,
      kind: "pat",
      displayName: record.name,
      organizationId: record.organizationId,
      scopes: record.scopes,
      userId: record.userId,
      clientId: null,
      apiKeyId: null,
    };
  }
  return null;
}
