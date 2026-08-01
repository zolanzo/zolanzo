# Phase 4.3A — Analytics Foundation

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** Trust Platform (4.2A–C)

## Mission

Build the Business Intelligence foundation.

> Every domain emits analytics events. Analytics never modifies domain data.

Infrastructure before dashboards — same discipline as AI (4.1) and Trust (4.2).

## Architecture

```text
Domain
  ↓
Analytics Event (idempotent ledger)
  ↓
Analytics Pipeline
  ↓
Analytics Store (events · daily metrics · snapshots · reports)
  ↓
Aggregations (daily → yearly)
  ↓
Reports / (Dashboards 4.3B)
```

Package: `lib/analytics/`

| Component | Path |
| --- | --- |
| AnalyticsEventService | `analytics-event-service.ts` |
| AnalyticsAggregator / DailyRollupJob | `aggregator.ts`, `daily-rollup-job.ts` |
| SnapshotGenerator | `snapshot-generator.ts` |
| AnalyticsQueryService | `query-service.ts` |
| AnalyticsService (public API) | `analytics-service.ts` |
| Safe emit | `safe-emit.ts` |

## Database

| Table | Role |
| --- | --- |
| `analytics_events` | Append-only event ledger + DLQ |
| `analytics_daily_metrics` | Daily rollups by dimension |
| `analytics_snapshots` | Period snapshots |
| `analytics_reports` | Structured report artifacts |

Migration: `prisma/migrations/20260726150000_analytics_foundation/`

Public IDs: `ANE-…` · `ANS-…` · `ANR-…`

## Event sources

Assignments · Campaigns · Organizations · Payments · Wallet · Reviews · Trust · AI · Notifications · Storage · Authentication · Marketplace

## Core events

`assignment.created` · `assignment.completed` · `campaign.created` · `campaign.completed` · `payment.completed` · `payment.failed` · `trust.updated` · `review.completed` · `worker.registered` · `organization.created` · `notification.sent` · `notification.failed` · `storage.uploaded` · `login.success` · `login.failed`

## Aggregations

Daily · Weekly · Monthly · Quarterly · Yearly (`periodWindowFor`)

## Report types

Campaign · Worker · Organization · Finance · Trust · AI · Operations

## Public API

```ts
import { AnalyticsService } from "@/lib/analytics";

await AnalyticsService.record({ ... });
await AnalyticsService.query({ source: "payments" });
await AnalyticsService.rollup({ period: "daily" });
await AnalyticsService.snapshot({ period: "weekly" });
await AnalyticsService.report({ reportType: "finance", period: "monthly" });
```

Domain emit (never throws into business flows):

```ts
import { safeRecordAnalyticsEvent } from "@/lib/analytics/safe-emit";
```

## Feature flags

| Flag | Default |
| --- | --- |
| `ANALYTICS_ENGINE` | on |
| `ANALYTICS_SNAPSHOTS` | on |
| `ANALYTICS_REPORTS` | on |

Product flags: `analytics.engine`, `analytics.snapshots`, `analytics.reports`

## Wired emitters (initial)

| Domain | Event |
| --- | --- |
| Marketplace claim | `assignment.created` |
| Review decision | `review.completed` |
| Settlement release | `payment.completed` |

Job `analytics.project-snapshot` runs daily rollup + snapshot.

## Admin

Command Center → **Analytics Health**

Events · events/hr · rollups · snapshot latency · failed · DLQ · by source

## Tests

`lib/analytics/analytics.test.ts`

Recording · aggregation · rollups · idempotency · snapshots · query · feature flags · periods

## Explicit non-goals (4.3A)

- Executive dashboards (4.3B)
- Forecasting (4.3C)
- Scheduled PDF/CSV exports (4.3D)
- Domain mutation from analytics

## Next

**4.3B — Executive Dashboards** ✅ See [PHASE_4_3B_EXECUTIVE_DASHBOARDS.md](./PHASE_4_3B_EXECUTIVE_DASHBOARDS.md).

Next: **4.3C — Forecasting & Decision Intelligence**.

## Implementation Report

1. **Features:** Unified analytics event pipeline, daily metrics, snapshots, reports, safe emit, Admin Analytics Health, cron wiring  
2. **Created:** `lib/analytics/*`, migration, `analytics-health.ts`, `PHASE_4_3A_ANALYTICS_FOUNDATION.md`  
3. **Modified:** schema, public IDs, feature flags, env, Command Center, admin page, claim/review/settlement emits, analytics job handler, ROADMAP  
4. **Database:** `analytics_events`, `analytics_daily_metrics`, `analytics_snapshots`, `analytics_reports`  
5. **Routes:** none  
6. **Env:** `ANALYTICS_ENGINE`, `ANALYTICS_SNAPSHOTS`, `ANALYTICS_REPORTS`  
7. **Security:** analytics is append-only / read-only wrt domain; emits isolated  
8. **Performance:** idempotent keys; capped query/rollup batches; incremental daily metric upserts  
9. **Tests:** `analytics.test.ts`  
10. **TODOs:** more domain emitters; RLS; scheduler verification in prod  
11. **Production readiness:** foundation ready after migration apply; dashboards deferred to 4.3B  
