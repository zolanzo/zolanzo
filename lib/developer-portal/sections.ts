/**
 * Portal navigation / section catalog — Phase 4.5D.
 */

import type { PortalSection } from "@/lib/developer-portal/types";
import { PORTAL_SECTIONS } from "@/lib/developer-portal/types";

const SECTIONS: PortalSection[] = [
  {
    id: "home",
    title: "Home",
    summary: "Overview of the ZOLANZO Developer Platform",
    href: "/developer",
    docsPath: "docs/developer/README.md",
  },
  {
    id: "getting-started",
    title: "Getting Started",
    summary: "First successful Public API call in minutes",
    href: "/developer/getting-started",
    docsPath: "docs/developer/getting-started.md",
  },
  {
    id: "authentication",
    title: "Authentication",
    summary: "API keys, OAuth 2.1, and bearer tokens",
    href: "/developer/authentication",
    docsPath: "docs/developer/authentication.md",
  },
  {
    id: "oauth",
    title: "OAuth 2.1",
    summary: "Client credentials foundation",
    href: "/developer/oauth",
    docsPath: "docs/developer/oauth.md",
  },
  {
    id: "api-keys",
    title: "API Keys",
    summary: "Create and rotate partner API keys",
    href: "/developer/api-keys",
    docsPath: "docs/developer/api-keys.md",
  },
  {
    id: "scopes",
    title: "Scopes",
    summary: "Permission scopes for every endpoint",
    href: "/developer/scopes",
    docsPath: "docs/developer/scopes.md",
  },
  {
    id: "rate-limits",
    title: "Rate Limits",
    summary: "Per-principal quotas and headers",
    href: "/developer/rate-limits",
    docsPath: "docs/developer/rate-limits.md",
  },
  {
    id: "pagination",
    title: "Pagination",
    summary: "Cursor-based list envelopes",
    href: "/developer/pagination",
    docsPath: "docs/developer/pagination.md",
  },
  {
    id: "idempotency",
    title: "Idempotency",
    summary: "Idempotency-Key for mutating calls",
    href: "/developer/idempotency",
    docsPath: "docs/developer/idempotency.md",
  },
  {
    id: "error-handling",
    title: "Error Handling",
    summary: "Stable public error envelope",
    href: "/developer/error-handling",
    docsPath: "docs/developer/errors.md",
  },
  {
    id: "public-resources",
    title: "Public Resources",
    summary: "Campaigns, assignments, trust, analytics, and more",
    href: "/developer/public-resources",
    docsPath: "docs/developer/resources.md",
  },
  {
    id: "webhooks",
    title: "Webhooks",
    summary: "Signed outbound event deliveries",
    href: "/developer/webhooks",
    docsPath: "docs/developer/webhooks.md",
  },
  {
    id: "integrations",
    title: "Integrations",
    summary: "Marketplace connectors on public contracts",
    href: "/developer/integrations",
    docsPath: "docs/developer/integrations.md",
  },
  {
    id: "sdk-downloads",
    title: "SDK Downloads",
    summary: "TypeScript / Node clients generated from OpenAPI",
    href: "/developer/sdks",
    docsPath: "docs/developer/sdks.md",
  },
  {
    id: "api-explorer",
    title: "API Explorer",
    summary: "Authorize, preview, and execute Public API calls",
    href: "/developer/explorer",
    docsPath: "docs/developer/explorer.md",
  },
  {
    id: "examples",
    title: "Examples",
    summary: "End-to-end integration recipes",
    href: "/developer/examples",
    docsPath: "docs/developer/examples.md",
  },
  {
    id: "changelog",
    title: "Changelog",
    summary: "Public API release notes",
    href: "/developer/changelog",
    docsPath: "docs/developer/changelog.md",
  },
  {
    id: "migration-guides",
    title: "Migration Guides",
    summary: "Version migration playbooks",
    href: "/developer/migration-guides",
    docsPath: "docs/developer/migration.md",
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Common integration questions",
    href: "/developer/faq",
    docsPath: "docs/developer/faq.md",
  },
];

export function listPortalSections(): PortalSection[] {
  return [...SECTIONS];
}

export function getPortalSection(id: string): PortalSection | undefined {
  return SECTIONS.find((s) => s.id === id);
}

export function portalCoverageRatio(): number {
  return SECTIONS.length / PORTAL_SECTIONS.length;
}
