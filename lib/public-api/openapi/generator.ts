/**
 * OpenAPI 3.1 generator — public schemas only.
 */

import { V1_ROUTES } from "@/lib/public-api/routes/v1";
import { PUBLIC_API_SCOPES } from "@/lib/public-api/types";
import { recordPublicOpenApiGeneration } from "@/lib/public-api/telemetry";
import { PUBLIC_API_MODEL_VERSION } from "@/lib/public-api/config";

export type OpenApiDocument = {
  openapi: "3.1.0";
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, Record<string, unknown>>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
  tags: Array<{ name: string }>;
};

export function generateOpenApiDocument(): OpenApiDocument {
  recordPublicOpenApiGeneration();
  const paths: OpenApiDocument["paths"] = {};
  const tagSet = new Set<string>();

  for (const route of V1_ROUTES) {
    if (route.path === "/openapi.json") continue;
    const pathKey = `/api/v1${route.path}`;
    paths[pathKey] ??= {};
    for (const t of route.tags) tagSet.add(t);

    const parameters: unknown[] = [];
    for (const part of route.path.split("/")) {
      if (part.startsWith("{") && part.endsWith("}")) {
        parameters.push({
          name: part.slice(1, -1),
          in: "path",
          required: true,
          schema: { type: "string" },
        });
      }
    }
    if (route.method === "GET") {
      parameters.push(
        {
          name: "cursor",
          in: "query",
          required: false,
          schema: { type: "string" },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100 },
        },
      );
    }

    const operation: Record<string, unknown> = {
      operationId: route.operationId,
      summary: route.summary,
      tags: route.tags,
      parameters,
      responses: {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessEnvelope" },
              example: {
                data: {},
                meta: { requestId: "req_example", apiVersion: "v1" },
              },
            },
          },
        },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden / scope denied" },
        "429": { description: "Rate limited" },
      },
    };

    if (!route.public) {
      operation.security = [{ ApiKeyAuth: [] }, { BearerAuth: [] }];
    }
    if (route.mutating) {
      operation.requestBody = {
        required: false,
        content: {
          "application/json": {
            schema: { type: "object", additionalProperties: true },
          },
        },
      };
      operation.parameters = [
        ...(parameters as unknown[]),
        {
          name: "Idempotency-Key",
          in: "header",
          required: true,
          schema: { type: "string" },
        },
      ];
    }

    paths[pathKey]![route.method.toLowerCase()] = operation;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "ZOLANZO Public API",
      version: "1.0.0",
      description: `Stable public contract (${PUBLIC_API_MODEL_VERSION}). Internal modules may evolve; this surface changes only via API versioning.`,
    },
    servers: [{ url: "https://api.zolanzo.com", description: "Production" }],
    paths,
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-Api-Key",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "OAuth/PAT",
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: "object",
          required: ["data", "meta"],
          properties: {
            data: {},
            meta: {
              type: "object",
              properties: {
                requestId: { type: "string" },
                apiVersion: { type: "string", enum: ["v1"] },
              },
            },
            page: {
              type: "object",
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        ErrorEnvelope: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message", "requestId", "documentation"],
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                requestId: { type: "string" },
                documentation: { type: "string" },
              },
            },
          },
        },
        Scopes: {
          type: "array",
          items: { type: "string", enum: [...PUBLIC_API_SCOPES] },
        },
      },
    },
    tags: [...tagSet].sort().map((name) => ({ name })),
  };
}

export function openApiToYaml(doc: OpenApiDocument): string {
  // Minimal YAML serializer sufficient for OpenAPI docs (no external dep).
  return jsonToYaml(doc);
}

function jsonToYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (value === null) return "null";
  if (typeof value === "string") {
    if (/[:\n#&*!|>%@`]/.test(value) || value === "") {
      return JSON.stringify(value);
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          const nested = jsonToYaml(item, indent + 1);
          return `${pad}-\n${nested
            .split("\n")
            .map((l) => (l ? `${"  ".repeat(indent + 1)}${l}` : l))
            .join("\n")
            .replace(/^\s+/, `${"  ".repeat(indent + 1)}`)}`;
        }
        return `${pad}- ${jsonToYaml(item)}`;
      })
      .join("\n");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return "{}";
    return entries
      .map(([k, v]) => {
        if (v && typeof v === "object") {
          const nested = jsonToYaml(v, indent + 1);
          if (nested === "{}" || nested === "[]") {
            return `${pad}${k}: ${nested}`;
          }
          return `${pad}${k}:\n${nested}`;
        }
        return `${pad}${k}: ${jsonToYaml(v)}`;
      })
      .join("\n");
  }
  return String(value);
}
