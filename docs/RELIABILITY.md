# Reliability

Phase **3A.2** operational reliability layer.

## Goals

- Critical cron schedules execute
- Dependencies are probed with healthy / degraded / unavailable semantics
- Jobs run with correlation, retries, locks, and structured logs
- Graceful shutdown drains in-flight work

## Components

| Area | Location |
| --- | --- |
| Cron runner | `jobs/runner/cron-runner.ts` |
| Job execution | `jobs/runner/execute.ts` |
| Handlers | `jobs/handlers/critical.ts` |
| Schedules | `jobs/schedules.ts` |
| Retry policies | `lib/reliability/retry.ts` |
| Dependency registry | `lib/reliability/dependency-registry.ts` |
| Locks | `lib/reliability/scheduler-lock.ts` |
| Probes | `lib/observability/probes.ts` |

## How to run the scheduler

```bash
# Dedicated process (recommended for production / staging)
npm run jobs:cron

# Optional: embed in Next.js process
ZOLANZO_CRON_ENABLED=1 npm run start
```

Default: Next instrumentation does **not** start cron unless `ZOLANZO_CRON_ENABLED=1`.

## Related

- [CRON_RUNNER.md](./CRON_RUNNER.md)
- [READINESS_PROBES.md](./READINESS_PROBES.md)
- [DEPENDENCY_REGISTRY.md](./DEPENDENCY_REGISTRY.md)
- [RETRY_POLICIES.md](./RETRY_POLICIES.md)
- [PHASE_3A2_RELIABILITY_REPORT.md](./PHASE_3A2_RELIABILITY_REPORT.md)
