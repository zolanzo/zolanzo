/**
 * Resolve request principal from Authorization / X-Api-Key headers.
 */

import { resolveApiKey } from "@/lib/public-api/auth/api-keys";
import { resolveBearerToken } from "@/lib/public-api/auth/oauth";
import { resolvePersonalAccessToken } from "@/lib/public-api/auth/pat";
import type { PublicPrincipal } from "@/lib/public-api/types";
import { PublicApiError } from "@/lib/public-api/errors";

export function resolvePrincipalFromHeaders(
  headers: Headers,
): PublicPrincipal {
  const apiKeyHeader =
    headers.get("x-api-key") ?? headers.get("X-Api-Key") ?? null;
  if (apiKeyHeader) {
    const principal = resolveApiKey(apiKeyHeader.trim());
    if (!principal) {
      throw new PublicApiError("UNAUTHORIZED", "Invalid API key", 401);
    }
    return principal;
  }

  const auth = headers.get("authorization") ?? headers.get("Authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    const oauth = resolveBearerToken(token);
    if (oauth) return oauth;
    const pat = resolvePersonalAccessToken(token);
    if (pat) return pat;
    throw new PublicApiError("UNAUTHORIZED", "Invalid bearer token", 401);
  }

  throw new PublicApiError(
    "UNAUTHORIZED",
    "Authentication required (API key or Bearer token)",
    401,
  );
}
