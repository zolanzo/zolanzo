/**
 * ExampleGenerator — curated Public API examples from OpenAPI operationIds.
 */

import { V1_ROUTES } from "@/lib/public-api/routes/v1";
import { setBrokenExamples } from "@/lib/developer-portal/telemetry";
import type { CodeExample } from "@/lib/developer-portal/types";

type ExampleSpec = {
  id: string;
  title: string;
  category: string;
  description: string;
  operationId: string;
  pathParams?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
};

const SPECS: ExampleSpec[] = [
  {
    id: "campaigns.list",
    title: "List campaigns",
    category: "Campaigns",
    description: "Paginated campaign list",
    operationId: "listCampaigns",
    query: { limit: "10" },
  },
  {
    id: "campaigns.get",
    title: "Get campaign",
    category: "Campaigns",
    description: "Fetch a campaign by public id",
    operationId: "getCampaign",
    pathParams: { id: "CMP-2026-000001" },
  },
  {
    id: "assignments.claim",
    title: "Claim assignment",
    category: "Assignments",
    description: "Claim an available assignment",
    operationId: "claimAssignment",
    pathParams: { id: "ASN-2026-000001" },
    body: { workerId: "WRK-2026-000001" },
  },
  {
    id: "trust.profile",
    title: "Read trust profile",
    category: "Trust",
    description: "Read-only trust profile (advisory)",
    operationId: "getTrustProfile",
    pathParams: { subjectId: "WRK-2026-000001" },
  },
  {
    id: "analytics.snapshots",
    title: "List analytics snapshots",
    category: "Analytics",
    description: "Aggregated snapshots — no raw events",
    operationId: "listAnalyticsSnapshots",
  },
  {
    id: "forecast.get",
    title: "Get campaign forecast",
    category: "Forecast",
    description: "Advisory forecast with confidence",
    operationId: "getForecast",
    pathParams: { type: "campaign" },
  },
  {
    id: "reports.generate",
    title: "Generate report",
    category: "Reports",
    description: "Generate an executive report",
    operationId: "generateReport",
    body: { type: "executive", format: "json" },
  },
  {
    id: "automation.list",
    title: "List automation rules",
    category: "Automation",
    description: "Governed automation rules",
    operationId: "listAutomationRules",
  },
  {
    id: "webhooks.create",
    title: "Create webhook subscription",
    category: "Webhooks",
    description: "Subscribe to signed outbound events",
    operationId: "createWebhookSubscription",
    body: {
      organizationId: "ORG-2026-000001",
      endpointUrl: "https://partner.example/hooks",
      eventTypes: ["assignment.completed"],
    },
  },
];

function buildExample(spec: ExampleSpec): CodeExample | null {
  const route = V1_ROUTES.find((r) => r.operationId === spec.operationId);
  if (!route) return null;

  let path = `/api/v1${route.path}`;
  for (const [k, v] of Object.entries(spec.pathParams ?? {})) {
    path = path.replace(`{${k}}`, v);
  }
  const qs = new URLSearchParams(spec.query ?? {}).toString();
  const url = `https://api.zolanzo.com${path}${qs ? `?${qs}` : ""}`;

  const curl = [
    `curl -X ${route.method} '${url}'`,
    `  -H 'X-Api-Key: $ZOLANZO_API_KEY'`,
    `  -H 'Accept: application/json'`,
    ...(route.mutating
      ? [
          `  -H 'Idempotency-Key: $(uuidgen)'`,
          `  -H 'Content-Type: application/json'`,
          `  -d '${JSON.stringify(spec.body ?? {})}'`,
        ]
      : []),
  ].join(" \\\n");

  const typescript = `import { ZolanzoClient } from "@zolanzo/sdk";

const client = new ZolanzoClient({ apiKey: process.env.ZOLANZO_API_KEY });

const result = await client.${spec.operationId}({
  pathParams: ${JSON.stringify(spec.pathParams ?? {})},
  query: ${JSON.stringify(spec.query ?? {})},
  body: ${spec.body !== undefined ? JSON.stringify(spec.body) : "undefined"},
});
`;

  return {
    id: spec.id,
    title: spec.title,
    category: spec.category,
    description: spec.description,
    operationId: spec.operationId,
    curl,
    typescript,
    scopes: [...route.scopes],
  };
}

export function generateExamples(): CodeExample[] {
  const examples: CodeExample[] = [];
  let broken = 0;
  for (const spec of SPECS) {
    const example = buildExample(spec);
    if (!example) {
      broken += 1;
      continue;
    }
    examples.push(example);
  }
  setBrokenExamples(broken);
  return examples;
}

export function getExample(id: string): CodeExample | undefined {
  return generateExamples().find((e) => e.id === id);
}

export const ExampleGenerator = {
  generate: generateExamples,
  get: getExample,
};
