# Phase 3A.2 — Reliability

**Status:** Complete  
**Scope:** Operational reliability only — no domain model, business logic, or public API contract changes (health payload extended additively).

## 1. Features implemented

- In-process cron runner with start / stop / health / graceful shutdown  
- All `CRON_SCHEDULES` registered with handlers  
- Critical jobs wired to existing domain services  
- Retry policies (immediate / exponential / finance / notifications)  
- Dependency registry + expanded readiness probes  
- Health aggregation (dependencies, scheduler, queue, build meta)  
- Scheduler locking (Postgres advisory lock or in-process)  
- Optional Next instrumentation + `npm run jobs:cron`  

## 2. Files created

- `lib/reliability/retry.ts` (+ test)  
- `lib/reliability/dependency-registry.ts`  
- `lib/reliability/cron.ts`  
- `lib/reliability/scheduler-lock.ts`  
- `lib/reliability/index.ts`  
- `lib/reliability/reliability.test.ts`  
- `jobs/runner/types.ts`  
- `jobs/runner/registry.ts`  
- `jobs/runner/execute.ts`  
- `jobs/runner/cron-runner.ts`  
- `jobs/runner/index.ts`  
- `jobs/runner/main.ts`  
- `jobs/handlers/critical.ts`  
- `instrumentation.ts`  
- `lib/observability/probes.reliability.test.ts`  
- `docs/RELIABILITY.md`  
- `docs/CRON_RUNNER.md`  
- `docs/READINESS_PROBES.md`  
- `docs/DEPENDENCY_REGISTRY.md`  
- `docs/RETRY_POLICIES.md`  
- `docs/PHASE_3A2_RELIABILITY_REPORT.md`  

## 3. Files modified

- `jobs/names.ts` — `notifications.retry`, `reservations.cleanup`  
- `jobs/schedules.ts` — critical schedules added  
- `lib/observability/probes.ts` — full readiness + aggregation  
- `lib/validation/env.ts` — `missingStrictKeysForProbe`  
- `constants/observability.ts` — health check ids  
- `package.json` — `jobs:cron`  
- `docs/ROADMAP.md`  

## 4. Cron runner

`CronRunner` ticks every 15s, matches UTC cron, dedupes per minute, executes via `executeRegisteredJob`.

## 5. Readiness probes

Database, Supabase Auth, Storage, Redis, Queue, Scheduler, Environment (+ app_alive).

## 6. Dependency registry

In-memory records with status, latency, last success/failure, metadata.

## 7. Retry policies

`withRetry` + named policies; finance/notification handlers use dedicated profiles.

## 8. Health endpoints

`/health` unchanged in purpose; `/readiness` now returns dependencies, scheduler, queue, process meta.

## 9. Scheduler lifecycle

Start → running ticks → stop/shutdown drains in-flight (timeout bounded).

## 10. Tests

Retry, cron matcher, registry, runner lifecycle/execution, readiness aggregation.

## 11. Documentation

See docs listed above.

## 12. Performance considerations

- Tick interval 15s; handlers batch-limited (50–500 rows)  
- Advisory locks only when DB configured  
- Auth/storage probes use short timeouts  

## 13. Security considerations

- Service-role storage probe is server-only  
- No secrets in job logs  
- Cron disabled in Next by default (avoid multi-instance double-run)  

## 14. Production readiness improvement

| Audit item | Before | After |
| --- | --- | --- |
| Critical cron runnable | ❌ | ✅ |
| Readiness probes | ⚠️ Partial | ✅ |
| Health aggregation | ⚠️ Partial | ✅ |
| Scheduler lifecycle | ❌ | ✅ |
| Retry infrastructure | ⚠️ | ✅ |

## 15. Remaining reliability gaps

- Distributed queues / Redis job locks  
- Cloud scheduler / K8s CronJob manifests  
- External monitoring (Sentry) — Phase 3A.3  
- Metrics & alerting — Phase 3A.3  
- DR / restore drills — Phase 3A.4  
- Digest / storage / session / analytics handlers still placeholders  

## Verification

Typecheck · Lint · Tests · Prisma validate · Production build (see sprint close-out).
