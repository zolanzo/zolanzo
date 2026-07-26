# Deployment

Four stages. Secrets and data isolation are mandatory.

## Environments

| Env | Target | Notes |
| --- | --- | --- |
| `development` | `next dev` + local/optional Supabase | Debug logs; destructive jobs allowed |
| `preview` | Vercel PR previews | Ephemeral; no prod data |
| `staging` | `staging.zolanzo.com` | Prod-like; MFA for admin; subset data |
| `production` | `zolanzo.com` | Multi-instance + workers |

Profiles: `config/environments.ts` · `ZOLANZO_ENV`

## Pipeline (design)

```
PR → typecheck · lint · unit → preview deploy
main → staging deploy → smoke health
tag/release → production → migrations → workers roll
```

## Migration rules

1. Prisma migrate against `DIRECT_URL`  
2. Expand → migrate → contract (no breaky deploys)  
3. Finance schema changes require dual-write / backfill plan  
4. Never run destructive migrate in production without backup  

## Workers & cron

- Deploy worker processes alongside (or as separate service)  
- Cron registers from `CRON_SCHEDULES`  
- Staging uses same schedules with feature flags gating payouts  

## Secrets

- Vercel / platform env stores; rotate regularly  
- Separate keys per environment  
- Service role key server-only  

## Rollback

- App: previous deployment  
- Schema: forward-fix preferred; restore from backup if catastrophic  
- Feature flags for kill-switches (`constants/feature-flags.ts`)  

## Regional roadmap

Suggested regions: `us-east-1`, `eu-west-1`, `af-south-1`  
Start single-region; add edge + storage multi-region before splitting microservices.  
