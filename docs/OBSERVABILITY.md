# Observability

Contracts for logs, traces, metrics, health, monitoring, and alerts.

## Phase status

| Slice | Status |
| --- | --- |
| 3A.1 Request lifecycle & correlation | ✅ |
| 3A.2 Reliability probes / cron | ✅ |
| 3A.4 Metrics · tracing · Sentry adapter · alerts · admin health | ✅ [PHASE_3A4_OBSERVABILITY_REPORT.md](./PHASE_3A4_OBSERVABILITY_REPORT.md) |

## Structured logs

Levels: `debug` · `info` · `warn` · `error` · `fatal` (`constants/observability.ts`)

Canonical envelope: [LOGGING_STANDARD.md](./LOGGING_STANDARD.md).

Logger auto-merges ALS context and **redacts** secrets (`lib/observability/redact.ts`).

Never log secrets, full PANs, or raw payment payloads.

## Tracing

Internal spans via `lib/observability/trace.ts` (`withSpan` / `startSpan` / `endSpan`).
Correlation IDs remain the primary join key across HTTP, jobs, webhooks, payments, ops, and AI.

OpenTelemetry OTLP export: deferred (endpoint env reserved: `OTEL_EXPORTER_ENDPOINT`).

## Metrics

In-process registry: `lib/observability/metrics.ts`

Categories include HTTP, DB, jobs, webhooks, payments, withdrawals, notifications, monitoring.

Snapshot feeds admin health dashboard + alert evaluation.

## Monitoring adapter

Port: `lib/integrations/monitoring/`

| Adapter | Role |
| --- | --- |
| `memory` | Local / test capture buffer |
| `sentry` | Primary — HTTP store API when `SENTRY_DSN` set; stub otherwise |

Use `captureException` / `captureMessage` — never import vendor SDKs from features.

## Health checks

Live/ready probes: `lib/observability/probes.ts` → `/health`, `/readiness`.

| Probe | Endpoint | Meaning |
| --- | --- | --- |
| Liveness | `/health` | Process up |
| Readiness | `/readiness` | Can take traffic |

Checks: app, environment, database, supabase_auth, storage, redis, queue, scheduler, **background_workers**.

## Alerts

Configurable thresholds: `lib/observability/alerts.ts`  
Evaluated in admin health dashboard (`features/admin/services/health.ts`).

## Related docs

- [CORRELATION_IDS.md](./CORRELATION_IDS.md)
- [REQUEST_LIFECYCLE.md](./REQUEST_LIFECYCLE.md)
- [LOGGING_STANDARD.md](./LOGGING_STANDARD.md)
- [READINESS_PROBES.md](./READINESS_PROBES.md)
