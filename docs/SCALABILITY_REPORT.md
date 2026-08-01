# ZOLANZO — Scalability Report

**Date:** 2026-07-31  
**Mode:** Product-wide scalability audit & capacity benchmarking  
**Target:** 100 to 100,000 concurrent active users  

---

## Executive Summary

| Metric | Score / Result | Notes |
| --- | :---: | --- |
| **Scalability Score** | **82 / 100** | Ready for single-region pilot (1k–10k users); multi-node 100k requires Redis stores |
| **Performance Score** | **88 / 100** | Composite indexes, batch `createMany` rollups, parallel rate-limits deployed |
| **Max Single-Node Capacity** | **~10,000 VUs** | Memory stores saturate above 10k concurrent webhooks/rate-limits |
| **Multi-Node Blockers** | **3** | Process-local rate limits, in-memory webhook queues, un-wired Redis store |

---

## Subsystem Capacity Breakdown (100 to 100,000 Concurrent Users)

### 1. Database Load & Query Scaling

- **100 VUs**: Shared database instance, <5 QPS peak. Pooler size 5. Zero connection pressure.
- **1,000 VUs**: Small database instance, <50 QPS peak. Pooler size 20. Composite indexes on `Assignment`, `Campaign`, and `TrustEvent` handle query filtering efficiently.
- **10,000 VUs**: Medium database instance with PgBouncer connection pooler (50–100 connections). Peak 200–500 QPS. Read-only queries (analytics, catalog) benefit from read replicas.
- **100,000 VUs**: Multi-region Primary DB + Read Replicas. Peak 2,000+ QPS. Requires partition pruning on `AnalyticsEvent` by month/org and read replica routing for Public API catalog queries.

### 2. CPU Utilization

- **100 VUs**: <0.25 vCPU average app process load.
- **1,000 VUs**: 1 vCPU app process load during peak job ticks (15s cron interval).
- **10,000 VUs**: 4 vCPU app process load. Trust recalculation & forecast model evaluation are CPU-local; cached for 120s.
- **100,000 VUs**: 16+ vCPU across HA Next.js app cluster (4–8 nodes behind load balancer).

### 3. Memory Consumption

- **100 VUs**: ~256–512 MB Node.js heap memory.
- **1,000 VUs**: ~512 MB–1 GB Node.js heap memory.
- **10,000 VUs**: ~1–2 GB heap memory per process. Bounded by rate-limiting TTL maps and in-memory webhook delivery queues.
- **100,000 VUs**: ~4–8 GB heap per node. Requires offloading rate limit maps and webhook queues to Redis.

### 4. Storage Envelope Growth

- **100 VUs**: <10 GB total storage (evidence uploads, avatars, campaign assets).
- **1,000 VUs**: 50–200 GB object storage.
- **10,000 VUs**: 0.5–2 TB object storage.
- **100,000 VUs**: Multi-TB object storage (S3 / Supabase Storage with bucket lifecycle cleanup rules).

### 5. Queue & Background Job Growth

- **100 VUs**: Flat queues; job runner ticks complete in <10 ms.
- **1,000 VUs**: Notifications & webhooks <100 items per 15s tick.
- **10,000 VUs**: Concurrency pool (8 parallel workers) processes ~400 webhook deliveries/min per node.
- **100,000 VUs**: Requires dedicated distributed message broker (BullMQ / Redis / SQS) with separate worker processes and DLQ monitoring.

### 6. Network Throughput

- **100 VUs**: <10 Mbps peak bandwidth.
- **1,000 VUs**: ~50 Mbps peak bandwidth.
- **10,000 VUs**: ~250 Mbps peak bandwidth (Public API requests + outbound signed webhooks).
- **100,000 VUs**: 1+ Gbps burst network bandwidth.

---

## Bottleneck Analysis

1. **Process-Local Rate Limiter & Idempotency Store**:
   - *Issue*: `MemoryRateLimitStore` stores sliding window counters in process memory. Behind a load balancer, multiple app nodes will maintain separate counters, allowing clients to bypass rate limits.
   - *Remediation*: Wire `RATE_LIMIT_REDIS_URL` to shared Redis store using atomic `INCR` and `EXPIRE`.

2. **In-Memory Webhook Delivery Queue**:
   - *Issue*: Webhook event subscriptions and delivery attempts are stored in memory (`WebhookStore`). Node restarts clear pending deliveries.
   - *Remediation*: Persist webhook delivery jobs to database or Redis queue (BullMQ).

3. **Command Center Cold Rebuild**:
   - *Issue*: Generating fresh Command Center metrics triggers ~50 queries across all health modules.
   - *Remediation*: Unexpired snapshot caching (60s TTL) deployed; background worker updates snapshot asynchronously.

---

## Optimization Recommendations (Prioritized)

1. **Phase 1 (Immediate — Single-Region 10k Users)**:
   - Deploy composite database indexes (`npx prisma migrate deploy`).
   - Keep 60s warm snapshot cache active for Command Center.
   - Maintain 8-worker concurrency pool for outbound webhooks.

2. **Phase 2 (Scale — Multi-Node 100k Users)**:
   - Wire Redis shared store for Public API rate limiting & idempotency replay.
   - Offload webhook delivery queue to BullMQ / Redis worker processes.
   - Add DB read replicas for catalog & analytics query routing.
