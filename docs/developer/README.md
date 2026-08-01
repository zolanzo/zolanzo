# ZOLANZO Developer Platform

Welcome to the ZOLANZO Developer Platform documentation.

## Core Philosophy

- **Public API v1 Contract**: Every external integration interacts exclusively through versioned `/api/v1` HTTP endpoints and signed Webhooks v1.
- **Strict Decoupling**: Internal domain services, Prisma models, and event buses remain completely private.
- **OpenAPI 3.1 Single Source of Truth**: All SDKs, API Explorer dry-runs, and resource catalogs derive directly from OpenAPI schemas.

## Quick Navigation

- [Getting Started](./getting-started.md) — Make your first Public API request in 2 minutes
- [Authentication](./authentication.md) — API Keys, OAuth 2.1 client credentials, and PATs
- [Public Resources](./resources.md) — Campaigns, Workers, Assignments, Trust, Analytics, Forecasts, Reports, and Automation
- [Webhooks](./webhooks.md) — Outbound signed event notifications
- [SDK Downloads](./sdks.md) — TypeScript & Node.js client libraries
- [API Explorer](./explorer.md) — Interactive dry-run request builder
- [Integration Marketplace](./integrations.md) — Managed third-party connectors
