/**
 * CredentialManager — OAuth / API key / webhook secret abstraction.
 * Secrets hashed at rest; plaintext only on create/rotate.
 */

import { createHash, randomBytes } from "node:crypto";
import {
  allocateMarketplaceIds,
  getCredential,
  getPlaintext,
  listCredentials,
  rememberPlaintext,
  saveCredential,
} from "@/lib/marketplace/store";
import type {
  CredentialKind,
  StoredCredential,
} from "@/lib/marketplace/types";

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function storeCredential(input: {
  installationId: string;
  kind: CredentialKind;
  label: string;
  secret?: string;
}): { credential: StoredCredential; secret: string } {
  const secret =
    input.secret ??
    `${input.kind === "oauth" ? "oat" : input.kind === "api_key" ? "iak" : "iws"}_${randomBytes(24).toString("base64url")}`;
  const id = allocateMarketplaceIds().credentialId;
  const now = new Date().toISOString();
  const credential: StoredCredential = {
    id,
    installationId: input.installationId,
    kind: input.kind,
    secretHash: hashSecret(secret),
    label: input.label,
    createdAt: now,
    rotatedAt: null,
    revokedAt: null,
  };
  saveCredential(credential);
  rememberPlaintext(id, secret);
  return { credential, secret };
}

export function rotateCredential(
  credentialId: string,
): { credential: StoredCredential; secret: string } | { error: string } {
  const existing = getCredential(credentialId);
  if (!existing || existing.revokedAt) {
    return { error: "Credential not found" };
  }
  const secret = `${existing.kind === "oauth" ? "oat" : existing.kind === "api_key" ? "iak" : "iws"}_${randomBytes(24).toString("base64url")}`;
  const next: StoredCredential = {
    ...existing,
    secretHash: hashSecret(secret),
    rotatedAt: new Date().toISOString(),
  };
  saveCredential(next);
  rememberPlaintext(credentialId, secret);
  return { credential: next, secret };
}

export function revokeCredential(credentialId: string): boolean {
  const existing = getCredential(credentialId);
  if (!existing) return false;
  existing.revokedAt = new Date().toISOString();
  saveCredential(existing);
  return true;
}

export function verifyCredential(
  credentialId: string,
  secret: string,
): boolean {
  const existing = getCredential(credentialId);
  if (!existing || existing.revokedAt) return false;
  return existing.secretHash === hashSecret(secret);
}

export function publicCredentialView(c: StoredCredential) {
  return {
    id: c.id,
    kind: c.kind,
    label: c.label,
    createdAt: c.createdAt,
    rotatedAt: c.rotatedAt,
  };
}

export const CredentialManager = {
  store: storeCredential,
  rotate: rotateCredential,
  revoke: revokeCredential,
  verify: verifyCredential,
  list: listCredentials,
  get: getCredential,
  getSecret: getPlaintext,
  publicView: publicCredentialView,
};
