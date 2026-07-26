# Phase 3A.1 — Request Lifecycle & Correlation

**Status:** Complete  
**Scope:** Observability infrastructure only — no business logic, domain model, or API contract changes.

## Mission

Every request, background job, webhook, notification dispatch, payment flow, and ops command carries a **Correlation ID** from start to finish as the primary trace key across logs and adapters.

## Files created

| File | Role |
| --- | --- |
| `lib/observability/correlation.ts` | UUID generate / validate / resolve; header constants |
| `lib/observability/request-context.ts` | AsyncLocalStorage context, job/webhook runners |
| `lib/observability/process-meta.ts` | Build version, git commit, startup, uptime |
| `lib/observability/with-server-context.ts` | Next headers → ALS for Server Actions |
| `jobs/correlation.ts` | Job-facing re-exports |
| `lib/observability/correlation.test.ts` | Middleware resolution unit tests |
| `lib/observability/request-context.test.ts` | ALS, webhook, job retry, logger fields |
| `lib/observability/process-meta.test.ts` | Health meta fields |
| `docs/CORRELATION_IDS.md` | Correlation contract |
| `docs/REQUEST_LIFECYCLE.md` | Lifecycle diagrams |
| `docs/LOGGING_STANDARD.md` | Log envelope standard |
| `docs/PHASE_3A1_CORRELATION_REPORT.md` | This report |

## Files modified

| File | Change |
| --- | --- |
| `middleware.ts` | Resolve/stamp `x-correlation-id` + `x-request-id` on request & response |
| `lib/observability/logger.ts` | Auto-merge context fields; `createLogger`; `logUnhandledError`; `child` |
| `lib/observability/probes.ts` | Health payload includes process meta |
| `features/payments/services/payment-platform.ts` | Webhook wrapped in `runWebhookWithContext` |
| `features/payments/actions/payment-actions.ts` | Create/verify via `withServerRequestContext` |
| `features/admin/services/operation-commands.ts` | Ensure/enrich context; audit `correlationId` |
| `features/admin/actions/operations-actions.ts` | Command action wrapped |
| `features/notifications/actions/notification-actions.ts` | Dispatch wrapped |
| `services/base.ts` | Optional `correlationId` / org on `ServiceContext` |
| `docs/OBSERVABILITY.md` | Points at new standards |
| `docs/ROADMAP.md` | Phase 3A.1 marked complete |

## Middleware

- Honors valid inbound `x-correlation-id` / `X-Correlation-ID`.
- Generates RFC4122 UUID when missing/invalid.
- Honors valid inbound `x-request-id`, else mints a hop id.
- Sets both on forwarded request headers and response (including auth redirects).

## Logger changes

- Every write merges active ALS: `correlationId`, `requestId`, identities, `operation`, `module`, job retry fields.
- `logUnhandledError` adds stack + timestamp + context.
- No change to log destination (stdout/stderr JSON lines).

## Context propagation

- **HTTP / actions:** middleware headers → `withServerRequestContext`.
- **Jobs:** `runJobWithContext`; retries pass `originalCorrelationId`.
- **Webhooks:** `runWebhookWithContext` from inbound headers.
- **Ops:** `ensureRequestContext` + enrich actor; metadata stores correlation.

## Performance impact

Negligible: one UUID resolve per request, ALS `run` (no deep cloning), small JSON field merge on log write. No extra DB round-trips.

## Security considerations

- Correlation IDs are opaque UUIDs — safe to echo in responses and support tickets.
- Invalid inbound values are rejected (regenerated) to avoid log injection / oversized headers.
- Logger still must not emit secrets or raw payment payloads (unchanged policy).

## Production readiness

| Item | Status |
| --- | --- |
| Correlation on HTTP | Done |
| Correlation on Server Actions (payments, ops, notifications) | Done |
| Webhook propagation | Done |
| Job / retry helpers | Done (runners should use `jobs/correlation`) |
| Health build/uptime fields | Done |
| Distributed tracing exporter (OTel) | Deferred to later 3A observability sprint |
| Cron runner wiring | Phase 3A.2 |

## Verification

- Typecheck · Lint · Tests · Production build (see sprint close-out)

## Next

**Phase 3A.2 — Reliability:** cron runner, readiness probes completion, operational blockers from the production readiness audit.
