/**
 * Public API scopes.
 */

import {
  PUBLIC_API_SCOPES,
  type PublicApiScope,
  type PublicPrincipal,
} from "@/lib/public-api/types";
import { PublicApiError } from "@/lib/public-api/errors";
import { recordPublicApiScopeFailure } from "@/lib/public-api/telemetry";

export function isPublicApiScope(value: string): value is PublicApiScope {
  return (PUBLIC_API_SCOPES as readonly string[]).includes(value);
}

export function requireScopes(
  principal: PublicPrincipal,
  required: PublicApiScope[],
): void {
  const have = new Set(principal.scopes);
  const missing = required.filter((s) => !have.has(s));
  if (missing.length) {
    recordPublicApiScopeFailure();
    throw new PublicApiError(
      "SCOPE_DENIED",
      `Missing required scope(s): ${missing.join(", ")}`,
      403,
      { missing },
    );
  }
}

export function parseScopeList(raw: string | undefined): PublicApiScope[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(isPublicApiScope);
}

export const ScopeCatalog = {
  all: PUBLIC_API_SCOPES,
  isKnown: isPublicApiScope,
  require: requireScopes,
  parse: parseScopeList,
};
