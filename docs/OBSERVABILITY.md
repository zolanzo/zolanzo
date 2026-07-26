# Observability

Contracts for logs, traces, metrics, and health.

## Phase 3A.1 (shipped)

Request lifecycle & correlation — see:

- [CORRELATION_IDS.md](./CORRELATION_IDS.md)
- [REQUEST_LIFECYCLE.md](./REQUEST_LIFECYCLE.md)
- [LOGGING_STANDARD.md](./LOGGING_STANDARD.md)
- [PHASE_3A1_CORRELATION_REPORT.md](./PHASE_3A1_CORRELATION_REPORT.md)

Every request/job/webhook should carry a **correlation ID**. Structured logs auto-merge ALS context via `lib/observability/logger.ts`.

## Goals

- Every request and job has a **correlation ID**
- Finance and work-engine spans are first-class
- Health distinguishes **liveness** vs **readiness** vs **dependency** failure

## Structured logs

Levels: `debug` · `info` · `warn` · `error` · `fatal` (`constants/observability.ts`)

Canonical envelope: [LOGGING_STANDARD.md](./LOGGING_STANDARD.md).

Never log secrets, full PANs, or raw payment payloads.

## Tracing

Suggested spans (`TRACE_SPANS`): HTTP, DB, queue enqueue/process, ledger post, escrow release, validation, email/SMS, webhook deliver.

OpenTelemetry exporters: later Phase 3A observability work (correlation IDs are the bridge).

## Metrics

Categories: `http`, `queue`, `database`, `cache`, `payments`, `work_engine`, `finance`, `auth`

Examples: request latency p95, queue depth, job failures, ledger post rate, escrow release latency, auth failure rate.

## Health checks

Live/ready probes: `lib/observability/probes.ts` → `/health`, `/readiness`.

Payload includes `buildVersion`, `gitCommit`, `startupTime`, `uptimeSeconds` plus dependency checks.

| Probe | Endpoint | Meaning |
| --- | --- | --- |
| Liveness | `/health` | Process up |
| Readiness | `/readiness` | Can take traffic |

## Dashboards (design)

- **Errors:** Sentry project + release tracking  
- **Performance:** Next.js / edge latency + DB + queue  
- **Product:** PostHog (optional) for funnels  

## Alerting (future runbooks)

- Queue depth > threshold  
- Payment webhook failure spike  
- Reconciliation mismatch  
- Auth error rate  
- Disk / storage 5xx  
