# Production Recovery Checklist

Use during DR drills and real incidents. Mark each item when verified.

**Environment:** _____________  
**Date:** _____________  
**Incident / drill id:** _____________  
**Commander:** _____________

---

## A. Database recovery

- [ ] Correct Supabase project confirmed (`ffvwviabpyhjeoxjxunb` / Zolanzo — not BamSignal)
- [ ] Backup or PITR restore point selected
- [ ] Restore completed (or DB healthy without restore)
- [ ] `npx prisma migrate status` → up to date
- [ ] `_prisma_migrations` present
- [ ] Sample query succeeds (`SELECT 1` / Prisma)
- [ ] `/readiness` database check `ok`

## B. Secrets recovery

- [ ] Vault accessible
- [ ] `.env.example` used as inventory (no secrets committed)
- [ ] `DATABASE_URL` / `DIRECT_URL` updated
- [ ] Supabase URL + anon + service role updated
- [ ] `CSRF_SECRET` present (≥32 chars)
- [ ] `WEBHOOK_SIGNING_SECRET` present
- [ ] Optional: `SENTRY_DSN`, Redis, provider keys
- [ ] Compromised secrets rotated
- [ ] Host env redeployed

## C. Domain / DNS recovery

- [ ] Apex / `www` / `staging` DNS targets correct host
- [ ] TLS certificates valid
- [ ] `NEXT_PUBLIC_APP_URL` matches public URL
- [ ] Auth redirect URLs updated in Supabase Auth settings

## D. Supabase recovery

- [ ] Project `ACTIVE_HEALTHY`
- [ ] Auth health endpoint reachable
- [ ] Storage buckets exist / recreated
- [ ] RLS enabled; policies present (incl. `20260726070000_rls_policies` when deployed)
- [ ] No cross-project credential reuse

## E. Deployment recovery

- [ ] Checkout known-good git tag / commit
- [ ] `npm ci` succeeds
- [ ] `npm run typecheck` / `npm test` / `npm run build` succeed (or host CI green)
- [ ] App deployment promoted / redeployed
- [ ] Previous deployment available for rollback
- [ ] `/health` returns 200
- [ ] `/readiness` not `down`

## F. Background workers

- [ ] Cron process running (`npm run jobs:cron`) or embedded intentionally
- [ ] `/readiness` scheduler / background_workers acceptable
- [ ] No duplicate uncontrolled cron leaders
- [ ] Critical schedules registered (`jobs/schedules.ts`)

## G. Third-party integrations

- [ ] Payment adapters: stub vs live documented; freeze if unsafe
- [ ] Notification adapters: retry failed jobs after provider recovery
- [ ] Identity / Passport (if wired): status checked
- [ ] Webhook signing secrets match providers

## H. Monitoring restoration

- [ ] Structured logs flowing
- [ ] Command Center loads (`/admin`)
- [ ] Latency / error rate / webhook footer populated
- [ ] Alerts evaluated (no unexplained criticals)
- [ ] Sentry receiving test event (if DSN set)
- [ ] Correlation IDs present on new requests

## I. Business continuity gates

- [ ] Money movement freeze lifted only after finance OK
- [ ] Marketplace / claims re-enabled only after inventory OK
- [ ] Stakeholder update sent
- [ ] Post-incident review scheduled

## Sign-off

| Role | Name | Signature / date |
| --- | --- | --- |
| Incident Commander | | |
| Database operator | | |
| App operator | | |
| Finance (if money involved) | | |
