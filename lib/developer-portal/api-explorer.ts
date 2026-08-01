/**
 * APIExplorer — authorize + preview calls (curl + TypeScript).
 * Dry-run only against the public contract — does not hit internal services.
 */

import { V1_ROUTES } from "@/lib/public-api/routes/v1";
import { isApiExplorerEnabled } from "@/lib/developer-portal/config";
import { recordExplorerPreview } from "@/lib/developer-portal/telemetry";
import type {
  ApiExplorerRequest,
  ApiExplorerResult,
} from "@/lib/developer-portal/types";

export function listExplorerOperations(): Array<{
  operationId: string;
  method: string;
  path: string;
  summary: string;
  tags: string[];
  scopes: string[];
  mutating: boolean;
}> {
  return V1_ROUTES.filter((r) => r.path !== "/openapi.json").map((r) => ({
    operationId: r.operationId,
    method: r.method,
    path: `/api/v1${r.path}`,
    summary: r.summary,
    tags: r.tags,
    scopes: [...r.scopes],
    mutating: Boolean(r.mutating),
  }));
}

export function previewApiCall(
  input: ApiExplorerRequest,
): ApiExplorerResult | { error: string } {
  if (!isApiExplorerEnabled()) {
    return { error: "API_EXPLORER disabled" };
  }
  const route = V1_ROUTES.find((r) => r.operationId === input.operationId);
  if (!route) return { error: `Unknown operation: ${input.operationId}` };

  let path = `/api/v1${route.path}`;
  for (const [k, v] of Object.entries(input.pathParams ?? {})) {
    path = path.replace(`{${k}}`, encodeURIComponent(v));
  }
  const base = (input.baseUrl ?? "https://api.zolanzo.com").replace(/\/$/, "");
  const url = new URL(base + path);
  for (const [k, v] of Object.entries(input.query ?? {})) {
    url.searchParams.set(k, v);
  }

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
  };
  if (input.apiKey) requestHeaders["X-Api-Key"] = input.apiKey;
  if (input.bearerToken) {
    requestHeaders.Authorization = `Bearer ${input.bearerToken}`;
  }
  if (route.mutating) {
    requestHeaders["Idempotency-Key"] = "explorer-preview-key";
    requestHeaders["Content-Type"] = "application/json";
  }

  const bodyStr =
    input.body !== undefined ? JSON.stringify(input.body, null, 2) : "";

  const curlParts = [
    `curl -X ${route.method} '${url.toString()}'`,
    ...Object.entries(requestHeaders).map(
      ([k, v]) => `  -H '${k}: ${v}'`,
    ),
  ];
  if (bodyStr) curlParts.push(`  -d '${bodyStr.replace(/'/g, "'\\''")}'`);

  const methodName = route.operationId;
  const typescript = `import { ZolanzoClient } from "@zolanzo/sdk";

const client = new ZolanzoClient({
  apiKey: ${input.apiKey ? JSON.stringify(input.apiKey) : "process.env.ZOLANZO_API_KEY"},
  accessToken: ${input.bearerToken ? JSON.stringify(input.bearerToken) : "undefined"},
  baseUrl: ${JSON.stringify(base)},
});

const result = await client.${methodName}({
  pathParams: ${JSON.stringify(input.pathParams ?? {}, null, 2)},
  query: ${JSON.stringify(input.query ?? {}, null, 2)},
  body: ${input.body !== undefined ? JSON.stringify(input.body, null, 2) : "undefined"},
  idempotencyKey: ${route.mutating ? '"explorer-preview-key"' : "undefined"},
});
`;

  recordExplorerPreview();
  return {
    operationId: route.operationId,
    method: route.method,
    url: url.toString(),
    requestHeaders,
    curl: curlParts.join(" \\\n"),
    typescript,
    dryRun: true,
    notes: [
      "Explorer preview is dry-run only — no network call is made from this service.",
      "Execute the generated curl or SDK call against /api/v1 from your environment.",
      ...(route.scopes.length
        ? [`Required scopes: ${route.scopes.join(", ")}`]
        : ["Public endpoint (no scopes)."]),
    ],
  };
}

export const APIExplorer = {
  listOperations: listExplorerOperations,
  preview: previewApiCall,
};
