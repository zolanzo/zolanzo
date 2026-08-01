/**
 * Developer Portal & SDK Platform — Phase 4.5D types.
 * Everything consumes Public API v1 — never internal services.
 */

export const DEVELOPER_PORTAL_MODEL_VERSION = "developer-portal/1.1.0";

export const PORTAL_SECTIONS = [
  "home",
  "getting-started",
  "authentication",
  "oauth",
  "api-keys",
  "scopes",
  "rate-limits",
  "pagination",
  "idempotency",
  "error-handling",
  "public-resources",
  "webhooks",
  "integrations",
  "sdk-downloads",
  "api-explorer",
  "examples",
  "changelog",
  "migration-guides",
  "faq",
] as const;

export type PortalSectionId = (typeof PORTAL_SECTIONS)[number];

export type PortalSection = {
  id: PortalSectionId;
  title: string;
  summary: string;
  href: string;
  docsPath: string;
};

export type SdkLanguage = "typescript" | "nodejs" | "curl" | "rest";

export type GeneratedSdkFile = {
  path: string;
  language: SdkLanguage;
  content: string;
};

export type SdkBundle = {
  generatedAt: string;
  openApiVersion: string;
  operationCount: number;
  files: GeneratedSdkFile[];
};

export type ApiExplorerRequest = {
  operationId: string;
  pathParams?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  apiKey?: string;
  bearerToken?: string;
  baseUrl?: string;
  /** When true, execute via Public API gateway (never internal services). */
  execute?: boolean;
};

export type ApiExplorerResult = {
  operationId: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  curl: string;
  typescript: string;
  schema?: {
    requestBody?: unknown;
    responses?: unknown;
    parameters?: unknown;
  };
  dryRun: boolean;
  response?: {
    status: number;
    body: unknown;
  };
  notes: string[];
};

export type CodeExample = {
  id: string;
  title: string;
  category: string;
  description: string;
  operationId: string;
  curl: string;
  typescript: string;
  rest?: string;
  scopes: string[];
};

export type QuickStartStep = {
  step: number;
  title: string;
  body: string;
  code?: string;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
  breaking: boolean;
};

export type MigrationGuide = {
  from: string;
  to: string;
  steps: string[];
  breaking: boolean;
};

export type DocIndexEntry = {
  id: string;
  title: string;
  path: string;
  version: string;
  source: "openapi" | "portal" | "static";
  exists: boolean;
};

export type DocumentationIndexResult = {
  version: string;
  generatedAt: string;
  entries: DocIndexEntry[];
  brokenLinks: string[];
  coverage: number;
};

export type PortalHealthCounters = {
  sdkGenerations: number;
  explorerPreviews: number;
  explorerExecutions: number;
  brokenExamples: number;
  brokenDocLinks: number;
  openApiFreshnessMs: number | null;
  documentationCoverage: number;
  lastSdkAt: string | null;
};
