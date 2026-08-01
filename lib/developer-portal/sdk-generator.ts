/**
 * SDKGenerator — generate TypeScript/Node clients from OpenAPI only.
 * Never hand-write endpoint lists.
 */

import { generateOpenApiDocument } from "@/lib/public-api/openapi/generator";
import { isSdkGenerationEnabled } from "@/lib/developer-portal/config";
import { recordSdkGeneration } from "@/lib/developer-portal/telemetry";
import type { GeneratedSdkFile, SdkBundle } from "@/lib/developer-portal/types";

function toMethodName(operationId: string): string {
  return operationId.replace(/[^a-zA-Z0-9_]/g, "_");
}

function extractOperations(doc: ReturnType<typeof generateOpenApiDocument>): Array<{
  operationId: string;
  method: string;
  path: string;
  summary: string;
  tags: string[];
}> {
  const ops: Array<{
    operationId: string;
    method: string;
    path: string;
    summary: string;
    tags: string[];
  }> = [];
  for (const [path, methods] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const o = op as {
        operationId?: string;
        summary?: string;
        tags?: string[];
      };
      if (!o.operationId) continue;
      ops.push({
        operationId: o.operationId,
        method: method.toUpperCase(),
        path,
        summary: o.summary ?? o.operationId,
        tags: o.tags ?? [],
      });
    }
  }
  return ops.sort((a, b) => a.operationId.localeCompare(b.operationId));
}

function generateTypescriptClient(
  ops: ReturnType<typeof extractOperations>,
): string {
  const methods = ops
    .map((op) => {
      const name = toMethodName(op.operationId);
      const pathExpr = JSON.stringify(op.path.replace(/^\/api\/v1/, "") || "/");
      return `  /** ${op.summary} */\n  async ${name}(options: RequestOptions = {}): Promise<unknown> {\n    return this.request(${JSON.stringify(op.method)}, ${pathExpr}, options);\n  }`;
    })
    .join("\n\n");

  return `/**
 * ZOLANZO Public API TypeScript SDK
 * AUTO-GENERATED from OpenAPI — do not hand-edit endpoints.
 * Generated at: ${new Date().toISOString()}
 */

export type RequestOptions = {
  pathParams?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  idempotencyKey?: string;
  headers?: Record<string, string>;
};

export class ZolanzoClient {
  constructor(
    private readonly config: {
      baseUrl?: string;
      apiKey?: string;
      accessToken?: string;
      fetch?: typeof fetch;
    } = {},
  ) {}

  private get baseUrl(): string {
    return (this.config.baseUrl ?? "https://api.zolanzo.com").replace(/\\/$/, "");
  }

  private async request(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<unknown> {
    let resolved = path;
    for (const [k, v] of Object.entries(options.pathParams ?? {})) {
      resolved = resolved.replace("{" + k + "}", encodeURIComponent(v));
    }
    const url = new URL(this.baseUrl + "/api/v1" + (resolved.startsWith("/") ? resolved : "/" + resolved));
    for (const [k, v] of Object.entries(options.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.headers ?? {}),
    };
    if (this.config.apiKey) headers["X-Api-Key"] = this.config.apiKey;
    if (this.config.accessToken) {
      headers.Authorization = \`Bearer \${this.config.accessToken}\`;
    }
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

    const fetchImpl = this.config.fetch ?? fetch;
    const res = await fetchImpl(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    return res.json();
  }

${methods}
}

export default ZolanzoClient;
`;
}

function generateNodeReadme(opsCount: number): string {
  return `# @zolanzo/sdk

Auto-generated from OpenAPI (${opsCount} operations).

\`\`\`ts
import { ZolanzoClient } from "./client";

const client = new ZolanzoClient({ apiKey: process.env.ZOLANZO_API_KEY });
const campaigns = await client.listCampaigns({ query: { limit: 10 } });
\`\`\`

Do not hand-write endpoints — regenerate via DeveloperPortalService.generateSdk().
`;
}

export function generateSdkFromOpenApi(): SdkBundle | { error: string } {
  if (!isSdkGenerationEnabled()) {
    return { error: "SDK_GENERATION disabled" };
  }
  const doc = generateOpenApiDocument();
  const ops = extractOperations(doc);
  const files: GeneratedSdkFile[] = [
    {
      path: "typescript/client.ts",
      language: "typescript",
      content: generateTypescriptClient(ops),
    },
    {
      path: "nodejs/README.md",
      language: "nodejs",
      content: generateNodeReadme(ops.length),
    },
    {
      path: "typescript/index.ts",
      language: "typescript",
      content: `export { ZolanzoClient, type RequestOptions } from "./client";\nexport { ZolanzoClient as default } from "./client";\n`,
    },
  ];
  recordSdkGeneration();
  return {
    generatedAt: new Date().toISOString(),
    openApiVersion: doc.info.version,
    operationCount: ops.length,
    files,
  };
}

export const SDKGenerator = {
  generate: generateSdkFromOpenApi,
};
