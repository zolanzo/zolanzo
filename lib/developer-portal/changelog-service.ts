/**
 * ChangelogService — public API release notes / migration notes.
 */

import type { ChangelogEntry } from "@/lib/developer-portal/types";

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.0.0",
    date: "2026-07-26",
    title: "Public API Platform",
    breaking: false,
    changes: [
      "Introduced /api/v1 contract layer",
      "API keys, OAuth client credentials, scopes, rate limits, idempotency",
      "OpenAPI 3.1 published at /api/v1/openapi.json",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-07-26",
    title: "Webhooks & Event Subscriptions",
    breaking: false,
    changes: [
      "Added /api/v1/webhooks subscription management",
      "HMAC-signed outbound deliveries with retry and DLQ",
      "New scopes: webhooks.read, webhooks.write, webhooks.replay",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-07-26",
    title: "Integration Marketplace",
    breaking: false,
    changes: [
      "Added /api/v1/integrations connector lifecycle",
      "Connectors use Public API + Webhooks only",
      "New scopes: integrations.read, integrations.write, integrations.manage",
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-07-26",
    title: "Developer Portal & SDK",
    breaking: false,
    changes: [
      "Developer portal sections and quick start",
      "TypeScript SDK generated from OpenAPI",
      "Interactive API Explorer (dry-run previews)",
      "Curated examples for campaigns, trust, webhooks, and more",
    ],
  },
];

export function listChangelog(): ChangelogEntry[] {
  return [...CHANGELOG].sort((a, b) => b.date.localeCompare(a.date));
}

export function getMigrationGuide(fromVersion: string, toVersion: string): {
  from: string;
  to: string;
  steps: string[];
} {
  return {
    from: fromVersion,
    to: toVersion,
    steps: [
      `Review changelog entries between ${fromVersion} and ${toVersion}.`,
      "Regenerate SDKs from the latest OpenAPI document.",
      "Update scopes on API keys / OAuth clients for any new endpoints.",
      "Re-run webhook signature verification tests.",
      "Additive v1 changes require no path migration; breaking changes will ship as /api/v2.",
    ],
  };
}

export const ChangelogService = {
  list: listChangelog,
  migrationGuide: getMigrationGuide,
};
