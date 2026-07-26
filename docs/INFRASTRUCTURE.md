# Infrastructure

Operational backbone for ZOLANZO. **Blueprint only** — no providers connected.

## Topology

```
Browser
  → Cloudflare (DNS · WAF · CDN · edge cache · image opt)
  → Next.js (App Router · API routes · SSR/ISR)
  → Supabase (Auth · Postgres · Storage · Realtime)
  → Redis (rate limit · locks · cache-aside)
  → Queue workers (BullMQ / Inngest)
  → Object storage + search + AI + observabilty adapters
```

Catalog: `constants/infrastructure.ts` · `REQUEST_PATH`

## Layers

| Layer | Role |
| --- | --- |
| Edge | Cloudflare DNS, WAF, CDN, cache rules |
| Application | Next.js multi-instance on Vercel (or equivalent) |
| Data | Supabase Postgres + Prisma; read replicas later |
| Cache | Redis for rate limits, job locks, hot projections |
| Queue | Background workers + cron scheduler |
| Storage | Supabase Storage buckets (`constants/storage.ts`) |
| Search | Postgres FTS → Meilisearch/Typesense → embeddings |
| Realtime | Supabase Realtime for assignment/notification fanout |
| Observability | Logs, traces, metrics, health probes |
| Secrets | Env per stage; never commit secrets |

## Edge & CDN

- Static assets and brand WebP via CDN
- Cache HTML carefully (user-specific dashboards: `private, no-store`)
- Cloudflare Images optional for resize; Sharp remains primary for brand pipeline
- WAF + bot management in front of auth and API key surfaces

## Object storage

Buckets: `public-brand`, `avatars`, `campaign-assets`, `submission-evidence`, `exports`, `temp-uploads`

Constraints: size caps, WebP on image upload, virus-scan hook, chunked uploads (future).

## Queue & workers

Queues: `default`, `critical`, `comms`, `media`, `finance`, `ai`, `search`, `cleanup`  
Job catalog: `jobs/names.ts` · schedules: `jobs/schedules.ts`  
Worker contracts: `workers/types.ts`

## Environments

`development` · `preview` · `staging` · `production`  
Profiles: `config/environments.ts` · targets: `DEPLOYMENT_TARGETS`

## Scaling (design)

Horizontal app instances · queue autoscale · PgBouncer · read replicas · regional edge · multi-region storage · future microservice splits (`constants/scaling.ts`).

## Explicit non-goals (Step 7)

- No live Cloudflare / Redis / queue wiring  
- No database creation  
- No third-party SDK connections  
