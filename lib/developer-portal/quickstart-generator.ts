/**
 * QuickStartGenerator — first successful Public API call guide.
 */

import type { QuickStartStep } from "@/lib/developer-portal/types";

export function generateQuickStart(): QuickStartStep[] {
  return [
    {
      step: 1,
      title: "Create an API key",
      body: "Provision a partner API key with the scopes you need (campaigns.read, etc.). Store the secret once — it is only shown at creation.",
    },
    {
      step: 2,
      title: "Call a read endpoint",
      body: "Verify authentication with a simple list call.",
      code: `curl -X GET 'https://api.zolanzo.com/api/v1/campaigns?limit=5' \\
  -H 'X-Api-Key: zk_live_…' \\
  -H 'Accept: application/json'`,
    },
    {
      step: 3,
      title: "Handle the public envelope",
      body: "Successful responses return { data, meta, page? }. Errors return { error: { code, message, requestId, documentation } }.",
    },
    {
      step: 4,
      title: "Add Idempotency-Key for mutations",
      body: "Every POST/PATCH/DELETE requires Idempotency-Key for safe retries.",
      code: `curl -X POST 'https://api.zolanzo.com/api/v1/reports/generate' \\
  -H 'X-Api-Key: zk_live_…' \\
  -H 'Idempotency-Key: report-2026-07-26' \\
  -H 'Content-Type: application/json' \\
  -d '{"type":"executive","format":"json"}'`,
    },
    {
      step: 5,
      title: "Subscribe to webhooks",
      body: "Create a webhook subscription and verify X-Zolanzo-Signature on delivery.",
    },
    {
      step: 6,
      title: "Install an SDK",
      body: "Generate the TypeScript client from OpenAPI via the Developer Portal — never hand-write endpoints.",
      code: `import { ZolanzoClient } from "@zolanzo/sdk";
const client = new ZolanzoClient({ apiKey: process.env.ZOLANZO_API_KEY });
await client.listCampaigns({ query: { limit: 5 } });`,
    },
  ];
}

export const QuickStartGenerator = {
  generate: generateQuickStart,
};
