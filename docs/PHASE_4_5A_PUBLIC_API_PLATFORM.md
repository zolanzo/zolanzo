# Phase 4.5A — Public API Platform

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** Phase 4 complete (AI · Trust · BI · Automation)

## Mission

Build the Public API Platform as a **contract layer**, not a wrapper around internal modules.

> Internal modules are free to evolve. Public contracts evolve only through API versioning.

The Public API is the only supported external interface to ZOLANZO: versioned, permission-scoped, audited, rate-limited, and stable.

## Architecture

```text
External Client
      ↓
API Gateway (/api/v1)
      ↓
Authentication → Authorization → Rate Limiter → Idempotency
      ↓
Request Validation → Public Controllers (v1)
      ↓
Application Services (public schemas)
      ↓
Domain Services (private)
      ↓
Audit
```

Package: `lib/public-api/`  
HTTP: `app/api/v1/[[...path]]/route.ts`

## Versioning

- Only `/api/v1/` is supported  
- Additive changes only within `v1`  
- Breaking changes require `v2`  
- Responses use versioned public schemas — never internal DTOs  

See [versioning.md](./api/versioning.md).

## Resources (v1)

| Area | Access |
| --- | --- |
| Identity (`/me`, OAuth token) | Auth |
| Organizations | Read / list |
| Workers | Read / list / search |
| Campaigns | Read / list / search |
| Assignments | Read / claim |
| Reviews | Status only |
| Payments | Status / settlement only |
| Trust | Read-only profile / passport |
| Analytics | Snapshots (no raw events) |
| Forecasts | Advisory + confidence + modelVersion |
| Reports | List / generate / download |
| Automation | Governed draft / submit / publish / simulate |

## Authentication

- API Keys (`X-Api-Key`) — hashed at rest  
- OAuth 2.1 client credentials foundation (`POST /oauth/token`)  
- Personal Access Tokens (Bearer)  

See [authentication.md](./api/authentication.md).

## Authorization

Scope-enforced endpoints. Catalog: [scopes.md](./api/scopes.md).

## Cross-cutting

| Concern | Behavior |
| --- | --- |
| Idempotency | `Idempotency-Key` required on mutations; response replay |
| Rate limiting | Per principal minute + daily quota; standard headers |
| Pagination | Cursor envelope `{ data, page: { nextCursor, hasMore } }` |
| Errors | Stable public format — [error-model.md](./api/error-model.md) |
| OpenAPI | 3.1 JSON + YAML — [openapi.yaml](./api/openapi.yaml) |
| Audit | Request-level trail (principal, path, status, requestId) |

## Feature flags

| Flag | Default |
| --- | --- |
| `PUBLIC_API` | on |
| `PUBLIC_API_V1` | on |
| `PUBLIC_OPENAPI` | on |
| `PUBLIC_RATE_LIMITING` | on |

Product flags: `api.public`, `api.public_v1`, `api.openapi`, `api.rate_limiting` (business plan)

## Admin

Command Center → **Public API Health**

Requests/min · error rate · latency · rate-limited · API keys · OAuth clients · scope failures · idempotency hits · OpenAPI status

## Security boundaries

Never exposed: internal IDs that must stay private · service topology · event bus · Prisma errors · trust mutation · raw analytics events · forecast internals · automation engine bypass · domain repositories

## Tests

`lib/public-api/public-api.test.ts` — auth, scopes, version routing, pagination, idempotency, rate-limit flags, OpenAPI, error format, audit, feature flags.

## Implementation Report

1. **Features:** Gateway, API keys, OAuth foundation, PATs, scopes, rate limit, idempotency, pagination, public schemas, v1 routes, OpenAPI, audit, Public API Health  
2. **Created:** `lib/public-api/*`, `app/api/v1/[[...path]]/route.ts`, `public-api-health.ts`, `docs/api/*`, this doc  
3. **Modified:** feature flags, env, `.env.example`, route-policy, command center, admin page, ROADMAP  
4. **Database:** none (credential stores in-memory; Prisma-ready later)  
5. **Routes:** `/api/v1/*` catch-all  
6. **Env:** `PUBLIC_API`, `PUBLIC_API_V1`, `PUBLIC_OPENAPI`, `PUBLIC_RATE_LIMITING`, rate/quota env knobs  
7. **Security:** hashed secrets, scope gates, public error model, no domain leakage  
8. **Performance:** in-memory rate limit / idempotency (Redis-ready via existing store abstraction)  
9. **Tests:** `public-api.test.ts` (17)  
10. **TODOs:** persist API keys/OAuth clients; bind catalog to live domain reads where needed  
11. **Production readiness:** `v1` contract ready for partners; expand catalog adapters as domains harden  

## Next

**Phase 4.5B — Webhooks & Event Subscriptions** ✅ See [PHASE_4_5B_WEBHOOKS.md](./PHASE_4_5B_WEBHOOKS.md). **Phase 4.5 complete** — see [PHASE_4_5D_DEVELOPER_PORTAL.md](./PHASE_4_5D_DEVELOPER_PORTAL.md).
