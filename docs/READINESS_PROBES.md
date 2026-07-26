# Readiness Probes

Endpoints:

- `GET /health` — liveness (`app_alive` only)
- `GET /readiness` — full dependency + scheduler aggregation

## Status vocabulary

| Probe (`ok` / `degraded` / `down`) | Registry (`healthy` / `degraded` / `unavailable`) |
| --- | --- |
| ok | healthy |
| degraded | degraded |
| down | unavailable |

## Checks

| ID | Meaning |
| --- | --- |
| `app_alive` | Process up |
| `environment` | Env parse + strict-key gap visibility |
| `database` | `SELECT 1` via Prisma |
| `supabase_auth` | `GET {SUPABASE_URL}/auth/v1/health` |
| `storage` | Service-role `listBuckets` when configured |
| `redis` | TCP connect when `REDIS_URL` / `RATE_LIMIT_REDIS_URL` set; else degraded |
| `queue` | In-process scheduler queue depth / status |
| `scheduler` | Cron runner lifecycle |

## Aggregated payload extras

Readiness includes:

- `dependencies` — registry snapshot  
- `scheduler` — runner health  
- `queue` — in-process queue health  
- `buildVersion`, `gitCommit`, `startupTime`, `uptimeSeconds`  

Development without `DATABASE_URL` stays **degraded** (not hard-down) so local UI can run.
