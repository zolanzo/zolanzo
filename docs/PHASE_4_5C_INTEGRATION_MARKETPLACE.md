# Phase 4.5C — Integration Marketplace

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** Phase 4.5A Public API + 4.5B Webhooks

## Mission

Build a managed integration platform that connects ZOLANZO to third parties **only through the Public API and Webhook Platform**.

> No connector may call internal services, repositories, or domain modules directly.

```text
Integration Marketplace
        │
Integration Registry → Connector Lifecycle → Connector Runtime
        │
Public API v1  +  Signed Webhooks v1
        │
Third-party Systems
```

Package: `lib/marketplace/` (separate from `lib/integrations/` provider adapters)

## Components

| Component | Path |
| --- | --- |
| IntegrationMarketplaceService | `marketplace-service.ts` |
| IntegrationRegistry | `integration-registry.ts` |
| ConnectorManager | `connector-manager.ts` |
| ConnectorRuntime | `connector-runtime.ts` |
| CredentialManager | `credential-manager.ts` |
| ConnectorHealthService | `connector-health.ts` |

## Starter connectors (7)

| ID | Category |
| --- | --- |
| `generic.webhook` | communication |
| `slack` | communication |
| `microsoft.teams` | communication |
| `google.workspace` | productivity |
| `zapier` | automation |
| `make` | automation |
| `n8n` | automation |

HR / Finance categories are reserved for future manifests.

## Lifecycle

`install → configure → authenticate → enable ↔ disable → upgrade → uninstall`

Configuration is versioned (`configVersion`) and auditable via Public API audit trail.

## Manifest fields

Name · description · version · required scopes · supported webhooks · supported API endpoints (`/api/v1/...` only) · configuration schema · health checks

## Credentials

OAuth · API keys · webhook secrets — hashed at rest, rotatable, plaintext only on create/rotate.

## Public API

| Method | Path | Scope |
| --- | --- | --- |
| GET | `/integrations` | `integrations.read` |
| GET | `/integrations/installed` | `integrations.read` |
| POST | `/integrations/install` | `integrations.write` |
| POST | `/integrations/{id}/configure` | `integrations.write` |
| POST | `/integrations/{id}/authenticate` | `integrations.manage` |
| POST | `/integrations/{id}/enable` | `integrations.manage` |
| POST | `/integrations/{id}/disable` | `integrations.manage` |
| GET | `/integrations/{id}/health` | `integrations.read` |
| POST | `/integrations/{id}/rotate-credentials` | `integrations.manage` |
| DELETE | `/integrations/{id}` | `integrations.manage` |

## Feature flags

| Flag | Default |
| --- | --- |
| `INTEGRATION_MARKETPLACE` | on (requires PUBLIC_API) |
| `CONNECTOR_RUNTIME` | on |
| `CONNECTOR_HEALTH` | on |

Product: `api.integration_marketplace`, `api.connector_runtime`, `api.connector_health`

## Admin

Command Center → **Integration Marketplace Health**

Catalog · installed · active · auth failures · sync failures · latency · version distribution

## Runtime isolation

`ConnectorRuntime.sync` may:

1. Create webhook subscriptions via `WebhookService`  
2. Declare which Public API endpoints the connector is allowed to call  

It never imports domain services.

## Tests

`lib/marketplace/marketplace.test.ts` — manifests, lifecycle, credentials, health, flags, Public API, isolation.

## Implementation Report

1. **Features:** Registry, lifecycle, credentials, runtime (Public API/Webhook only), health, Public API routes, admin panel  
2. **Created:** `lib/marketplace/*`, `integration-marketplace-health.ts`, this doc  
3. **Modified:** public API scopes/routes, flags, env, command center, admin, ROADMAP, 4.5B next, scopes.md  
4. **Database:** none (in-memory)  
5. **Routes:** `/api/v1/integrations*`  
6. **Env:** `INTEGRATION_MARKETPLACE`, `CONNECTOR_RUNTIME`, `CONNECTOR_HEALTH`  
7. **Security:** hashed credentials; scoped management; no internal access  
8. **Performance:** in-memory catalog + install store  
9. **Tests:** `marketplace.test.ts`  
10. **TODOs:** persist installs; live OAuth providers; HR/Finance starters  
11. **Production readiness:** marketplace contract ready for partner connectors  

## Next

**Phase 4.5D — SDKs & Developer Portal** ✅ See [PHASE_4_5D_DEVELOPER_PORTAL.md](./PHASE_4_5D_DEVELOPER_PORTAL.md). **Phase 4.5 complete.**
