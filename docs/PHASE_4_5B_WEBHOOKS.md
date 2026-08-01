# Phase 4.5B — Webhooks & Event Subscriptions

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** Phase 4.5A Public API Platform

## Mission

Expose a managed **outbound** event platform.

Webhooks are consumers of already-committed platform events. They never publish into domains.

```text
Domain Events → Webhook Publisher → Subscriptions → Filter
  → Delivery Scheduler → Retry / DLQ → Signature → Customer Endpoint
  → Delivery History
```

Package: `lib/webhooks/`  
Public API: `/api/v1/webhooks`

## Components

| Component | Path |
| --- | --- |
| WebhookService | `webhook-service.ts` |
| SubscriptionRegistry | `subscription-registry.ts` |
| FilterEngine | `filter-engine.ts` |
| DeliveryScheduler | `delivery-scheduler.ts` |
| RetryEngine | `retry-engine.ts` |
| SignatureService | `signature-service.ts` |
| ReplayService | `replay-service.ts` |
| DeliveryHistoryService | `delivery-history.ts` |

## Event catalog (20)

Identity · Campaigns · Assignments · Reviews · Payments · Trust (read-only) · Reports · Forecasts (`advisoryOnly`) · Automation (governance-safe)

## Envelope

```json
{
  "id": "…",
  "event": "assignment.completed",
  "occurredAt": "…",
  "version": "v1",
  "data": {},
  "requestId": "…",
  "deliveryId": "…"
}
```

## Security headers

`X-Zolanzo-Event` · `X-Zolanzo-Timestamp` · `X-Zolanzo-Signature` (`v1=hmac`) · `X-Zolanzo-Delivery`

## Public API

| Method | Path | Scope |
| --- | --- | --- |
| GET | `/webhooks` | `webhooks.read` |
| POST | `/webhooks` | `webhooks.write` |
| PATCH | `/webhooks/{id}` | `webhooks.write` |
| DELETE | `/webhooks/{id}` | `webhooks.write` |
| POST | `/webhooks/{id}/rotate-secret` | `webhooks.write` |
| GET | `/webhooks/deliveries` | `webhooks.read` |
| POST | `/webhooks/deliveries/{id}/replay` | `webhooks.replay` |

Reuses 4.5A auth, scopes, rate limits, idempotency, audit.

## Feature flags

| Flag | Default |
| --- | --- |
| `PUBLIC_WEBHOOKS` | on (requires PUBLIC_API) |
| `WEBHOOK_DELIVERY` | on |
| `WEBHOOK_REPLAY` | on |

Product: `api.webhooks`, `api.webhook_delivery`, `api.webhook_replay`

## Admin

Command Center → **Webhook Health**

Active subscriptions · deliveries/min · success rate · retry rate · DLQ · replays · latency

## Domain emit

`safePublishWebhookEvent(...)` — fire-and-forget; never fails domain flows.

## Tests

`lib/webhooks/webhooks.test.ts` — CRUD, filtering, delivery, signature, retry/DLQ, replay, flags, Public API.

## Implementation Report

1. **Features:** Subscriptions, filters, signed delivery, retry/DLQ, replay, history, Public API routes, Webhook Health  
2. **Created:** `lib/webhooks/*`, `webhook-health.ts`, this doc  
3. **Modified:** public API scopes/routes, feature flags, env, `.env.example`, command center, admin page, ROADMAP, 4.5A next, scopes.md  
4. **Database:** none (in-memory; Prisma-ready later)  
5. **Routes:** `/api/v1/webhooks*`  
6. **Env:** `PUBLIC_WEBHOOKS`, `WEBHOOK_DELIVERY`, `WEBHOOK_REPLAY`  
7. **Security:** HMAC signatures, hashed secrets, scoped management  
8. **Performance:** queued delivery + exponential backoff  
9. **Tests:** `webhooks.test.ts`  
10. **TODOs:** persist subscriptions/deliveries; wire domain emitters broadly; worker flush job  
11. **Production readiness:** outbound contract ready for partners  

## Next

**Phase 4.5C — Integration Marketplace** ✅ See [PHASE_4_5C_INTEGRATION_MARKETPLACE.md](./PHASE_4_5C_INTEGRATION_MARKETPLACE.md). **Phase 4.5 complete** — see [PHASE_4_5D_DEVELOPER_PORTAL.md](./PHASE_4_5D_DEVELOPER_PORTAL.md).
