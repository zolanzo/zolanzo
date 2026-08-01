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

## Release Candidate (RC1) & closed pilot

- Governance: [RC1_GOVERNANCE.md](./RC1_GOVERNANCE.md) (`main` · `release/1.0` · `develop`)  
- Pilot ops: [CLOSED_PILOT_PROGRAM.md](./CLOSED_PILOT_PROGRAM.md)  
- Kickoff readiness: [CLOSED_PILOT_REPORT.md](./CLOSED_PILOT_REPORT.md) — **GO WITH CONDITIONS**  
- During pilot: bug/security/reliability only on `release/1.0` — no schema or features  

## Disaster recovery

Full backup / restore / incident procedures:

- [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md)
- [BUSINESS_CONTINUITY_PLAN.md](./BUSINESS_CONTINUITY_PLAN.md)
- [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md)
- [PRODUCTION_RECOVERY_CHECKLIST.md](./PRODUCTION_RECOVERY_CHECKLIST.md)
- [PHASE_3A5_DR_REPORT.md](./PHASE_3A5_DR_REPORT.md)

## Regional roadmap

Suggested regions: `us-east-1`, `eu-west-1`, `af-south-1`  
Start single-region; add edge + storage multi-region before splitting microservices.  
