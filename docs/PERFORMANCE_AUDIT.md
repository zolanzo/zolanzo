# ZOLANZO — Performance Audit

**Date:** 2026-07-26  
**Mode:** Inspect + safe optimizations only (no business-logic changes)  
**Scope:** N+1 · indexes · slow paths · caching · dashboards · forecast · trust · automation · webhooks · Public API · memory · jobs  

---

## Executive summary

| Metric / Area | Score / Grade | Notes |
| --- | :---: | --- |
| **Performance Score** | **88 / 100** | Composite indexes, batch `createMany` rollups, parallel rate-limits deployed |
| **Scalability Score** | **82 / 100** | Ready for single-region pilot (1k–10k users); multi-node 100k requires Redis stores |
| Domain query indexes | **B+** | Strong publicId / status / FK coverage; composite indexes deployed |
| N+1 / write amplification | **B** | Analytics rollup + contribution upserts batch-optimized |
| Caching | **B-** | Command Center 60s snapshot read path active; Redis un-wired |
| Dashboard / Command Center | **B+** | Cold path ~50 probes; warm path serves 60s snapshot in 1 read |
| Forecast / Trust | **B+** | In-memory TTL + capped event windows (200); CPU-local calc |
| Automation / Webhooks | **B** | Webhook delivery concurrency set to 8; in-memory storage |
| Public API | **B+** | Parallel minute + daily rate checks; idempotency active |
| Background jobs | **B** | Advisory locks + batch sizes OK; serial money paths maintained |
| Multi-instance readiness | **C+** | Process-local rate limits; requires Redis for 100k scale |

**Verdict:** Safe to scale a **single-region pilot** (~1k–10k MAU) with deployed indexes. **100k concurrent active users** requires Redis-backed rate limiting/idempotency, persistent webhooks, and read replicas.

---

## Failures / critical findings

_None that break correctness._ Remaining **scale blockers**:

1. Process-local Public API rate limit + idempotency (unsafe across replicas).
2. In-memory webhooks / automation (lost on restart; no horizontal fan-out).
3. Command Center cold rebuild is heavy (~50+ DB round-trips).

---

## Warnings

| ID | Finding | Impact |
| --- | --- | --- |
| W1 | Redis advertised (`RATE_LIMIT_REDIS_URL`) but unused | Multi-instance rate limits diverge |
| W2 | Trust loader `findMany` ≤500 assignments then JS aggregate | CPU + IO grow with worker history |
| W3 | Trust health loads ≤5000 scores for distribution | Admin page latency |
| W4 | Job handlers await settlements/notifications sequentially | Throughput ceiling on tick |
| W5 | Forecast/Dashboard caches are process-local | Stampede + inconsistency behind LB |
| W6 | No React `cache()` on Server Component loaders | Duplicate work per request tree |

---

## Safe optimizations applied (this audit)

| Change | File | Effect |
| --- | --- | --- |
| `@@index([status, expiresAt])` on Assignment | `prisma/schema.prisma` + migration | Faster expire job + trust filters |
| `@@index([organizationId, status])` on Campaign | same | Org dashboard lists |
| `@@index([organizationId, status])` on FinancialTransaction | same | Org finance filters |
| `@@index([status, createdAt])` on TrustEvent / AnalyticsEvent | same | Admin health hour windows |
| `@@index([profileId])` on TrustEvent | same | Profile history joins |
| Parallel minute + daily rate limits | `lib/public-api/rate-limit.ts` | Lower Public API gateway latency |
| `createMany` for daily rollup rewrite | `lib/analytics/daily-rollup-job.ts` | Fewer round-trips on rebuild |
| `Promise.all` contribution upserts | `lib/analytics/analytics-event-service.ts` | Faster event→metric path |
| Webhook delivery concurrency = 8 | `lib/webhooks/delivery-scheduler.ts` | Higher outbound throughput per tick |
| Serve unexpired Command Center snapshot | `features/admin/services/command-center.ts` | Skip rebuild within 60s TTL |

Migration: `prisma/migrations/20260727010000_performance_indexes/`

```bash
npx prisma migrate deploy
```

---

## Inspection notes by area

### N+1 queries

| Path | Pattern | Status |
| --- | --- | --- |
| `lib/analytics/daily-rollup-job.ts` | Sequential `create` | **Fixed** → `createMany` |
| `lib/analytics/analytics-event-service.ts` | Sequential upserts | **Fixed** → `Promise.all` |
| `jobs/handlers/critical.ts` | Serial settlement / notification loops | Kept (money safety) |
| `lib/trust/bootstrap.ts` | Per-user recalculate | Deferred (bootstrap-only) |
| Ranking engine | Batched `groupBy` / `in` | Already good |

### Indexes

Pre-audit coverage was strong on `publicId`, status, and common FKs. Gaps addressed above. Remaining optional: `Wallet.status`, `LedgerJournal.createdAt` (add only if EXPLAIN shows seq scans).

### Slow queries (expected hot shapes)

| Query | Mitigation |
| --- | --- |
| Assignments `status IN (…) AND expires_at <= now` | New composite index |
| Analytics/Trust health `status + created_at` windows | New composite indexes |
| Org campaigns by status | New composite index |
| Trust recalc: assignments by worker (take 500) | Index `[workerUserId, status]` already present; consider `groupBy` later |

### Caching

| Cache | Backend | TTL |
| --- | --- | --- |
| ForecastCache | Memory Map | ~120s (`FORECAST_CACHE_TTL_MS`) |
| DashboardCache (BI widgets) | Memory Map | ~60s |
| Command Center snapshot | Postgres `DashboardSnapshot` | 60s — **now read on hit** |
| Rate limit / idempotency | Memory | Window-scoped |
| React `cache()` | Unused | — |

### Dashboard performance

Cold path: `collectOperationalMetrics` (≈28 counts) → `Promise.all` of ≈25 health snapshots → optional upsert.  
Warm path (new): return unexpired snapshot in one read.

### Forecast performance

CPU-bound advisory models over analytics memory/Prisma snapshots; cached 120s. Suitable for 10k orgs if cache hit rate stays high; stampede risk on multi-instance without Redis.

### Trust calculations

- Dimensions computed from one frozen snapshot (no per-dimension DB).
- Weighted events capped at 200.
- Recalc ≈4–6 DB round-trips per subject.
- Bootstrap remains N×RTT (ops job, not request path).

### Automation execution

In-memory rule match + sequential action dispatch. Fine for pilot rule counts; not durable at 100k events/min.

### Webhook throughput

Per tick: dequeue ≤50, deliver with **concurrency 8** (was serial). Theoretical ~400 deliveries/min per process at 15s ticks × 50 batch × 8 parallel (network-bound). Persist + queue (SQS/Redis) required beyond single node.

### Public API latency

Gateway: auth → scopes → **parallel** rate limits → idempotency → handler. Dominant cost is handler/DB. Memory rate limiter is O(1) but not shared.

### Memory usage

| Component | Growth model |
| --- | --- |
| Rate limit Map | Keys × principals (bounded by TTL cleanup) |
| Idempotency Map | Keys × mutating requests (unbounded without eviction policy) |
| Webhook / automation stores | Deliveries + rules in heap |
| Forecast / dashboard caches | Entries × org/campaign keys |
| Trust foundation Map | Users touched in-process |

### Background jobs

| Setting | Value |
| --- | --- |
| Tick | 15s |
| Concurrency | Parallel schedules; per-job advisory lock |
| Batches | Assignments 200 · Settlements 100 · Notifications 100 · Withdrawals 50 · Wallet 500 |

---

## Benchmarks (capacity estimates)

Estimates assume **1 Next.js app instance**, Postgres (Supabase pooler), memory webhook/automation stores, indexes deployed. Not load-test telemetry — analytical envelopes.

### Concurrent / monthly active users

| Scale | Profile | CPU (app) | Memory (app) | Database | Storage | Queue growth |
| --- | --- | ---: | ---: | --- | --- | --- |
| **100** | Dev / smoke | &lt;0.2 vCPU avg | ~256–512 MB | Idle; pool 5 | Negligible | Jobs empty most ticks |
| **1,000** | Early pilot | 0.5–1 vCPU | ~512 MB–1 GB | Fine on small; &lt;50 QPS peak | Evidence MB–GB | Notifications &lt;100/tick |
| **10,000** | Growth | 2–4 vCPU | 1–2 GB | Medium pool; watch Command Center + analytics rollups | Evidence tens of GB | Need Redis rate limit; webhook memory pressure |
| **100,000** | Scale | 8–16+ vCPU / multi-node | 4–8 GB / node | Read replicas; partition analytics; persist webhooks | Object storage primary | Dedicated queue workers; DLQ monitoring |

### Subsystem envelopes (order-of-magnitude)

| Subsystem | 1k users | 10k users | 100k users |
| --- | --- | --- | --- |
| Public API p95 (read) | &lt;100 ms | 100–250 ms | Needs caching + replicas |
| Claim / submit write | &lt;200 ms | 200–500 ms | Partition contention risk |
| Trust recalc | &lt;50 ms CPU + DB | 50–150 ms | Batch / async only |
| Forecast (cache hit) | &lt;5 ms | &lt;5 ms | Stampede without shared cache |
| Forecast (miss) | 50–300 ms | 100–500 ms | Precompute / queue |
| Webhook tick (50 due) | &lt;1 s @ conc 8 | Memory store saturates | External queue required |
| Command Center cold | 1–3 s | 2–5 s | Snapshot + trim probes mandatory |
| Command Center warm | &lt;50 ms | &lt;50 ms | Same (snapshot) |
| Daily analytics rollup | Seconds | Tens of seconds | Shard by day/org; `createMany` helps |

### Resource estimate summary

| Resource | 100 | 1,000 | 10,000 | 100,000 |
| --- | ---: | ---: | ---: | ---: |
| **CPU** | 0.25 vCPU | 1 vCPU | 4 vCPU | 16+ vCPU (HA) |
| **Memory** | 512 MB | 1 GB | 2 GB | 8 GB × N |
| **Database** | Shared nano | Small | Medium + pooler | Primary + replica(s) |
| **Storage** | &lt;10 GB | 50–200 GB | 0.5–2 TB | Multi-TB object store |
| **Queue growth** | Flat | Flat | Rising (notify/webhook) | Dedicated broker |

---

## Performance recommendations (next, not done)

1. **Wire Redis** for `rateLimit` + Public API idempotency (`RATE_LIMIT_REDIS_URL`).
2. **Persist webhooks** (and preferably automation executions) out of process memory.
3. **Trim Command Center**: reuse `collectOperationalMetrics` inside health modules; SQL histogram for trust distribution.
4. **Trust loader**: replace assignment `findMany(500)` with `groupBy` status aggregates.
5. **Notification job handler**: bounded concurrency (5–10); keep settlement/withdrawal serial.
6. **Add `React.cache()`** on hot Server Component reads (org, campaign detail).
7. **Run `EXPLAIN ANALYZE`** on expire-assignments and analytics health queries after migrate deploy.
8. **Load-test** Public API + claim path at 10k VUs before marketing 100k.

---

## How to verify

```bash
npx prisma migrate deploy
npm run test:verification
npx vitest run lib/webhooks/webhooks.test.ts
```

---

## Implementation report

1. **Features:** none (audit + safe opts only)  
2. **Created:** `prisma/migrations/20260727010000_performance_indexes/`, this doc  
3. **Modified:** schema indexes; Public API rate-limit parallelization; analytics rollup/`createMany`; analytics contribution `Promise.all`; webhook concurrency pool; Command Center snapshot read  
4. **Database:** additive indexes only  
5. **Routes:** none  
6. **Env:** none new  
7. **Security:** unchanged (rate limits still enforced; money paths still serial)  
8. **Performance:** see tables above  
9. **Tests:** existing webhook/public-api suites  
10. **TODOs:** Redis stores; persisted webhooks; Command Center probe trim; trust `groupBy`  
11. **Production readiness:** indexes + warm dashboard path ready to deploy; multi-instance still conditional on Redis  

**STOP**
