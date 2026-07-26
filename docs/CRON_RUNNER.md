# Cron Runner

## Lifecycle

| Method | Behavior |
| --- | --- |
| `start()` | Begin 15s tick loop; fire matching `CRON_SCHEDULES` |
| `stop()` | Clear timer; drain in-flight |
| `shutdown(timeoutMs)` | Graceful stop with timeout |
| `getHealth()` | Scheduler status for readiness |
| `tick(now)` | Manual/test tick |

## Registration

All production schedules in `jobs/schedules.ts` have handlers via `registerAllJobHandlers()`:

**Critical (domain-wired):**

- `assignments.expire`
- `reservations.cleanup`
- `settlements.process-batch`
- `finance.reconcile-daily`
- `notifications.retry`
- `withdrawals.process`

**Registered placeholders (idempotent no-ops until domain wiring):**

- `notifications.digest`
- `storage.cleanup-temp`
- `auth.cleanup-sessions`
- `analytics.project-snapshot`

## Deduplication

1. Per UTC minute fire key (`cronFireKey`) — skip duplicate ticks in the same minute  
2. Scheduler lock (`withSchedulerLock`) — Postgres advisory lock when DB configured; else in-process mutex  

## Distributed locking assumption

True multi-instance Redis / etcd locks are **deferred**. Multi-replica safety today requires either:

- a **single** cron process (`npm run jobs:cron`), or  
- shared Postgres so advisory locks serialize execution across processes  

## Entry points

- CLI: `jobs/runner/main.ts` → `npm run jobs:cron`  
- Optional Next: `instrumentation.ts` when `ZOLANZO_CRON_ENABLED=1`  

## Logging

Each execution logs: `correlationId`, `jobId`, `jobName`, `schedule`, `durationMs`, result summary, `retryCount`.
