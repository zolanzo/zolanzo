# Disaster Recovery Plan

**Product:** ZOLANZO  
**Phase:** 3A.5  
**Authority:** Operations + Engineering  
**Companion:** [BUSINESS_CONTINUITY_PLAN.md](./BUSINESS_CONTINUITY_PLAN.md) · [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md) · [PRODUCTION_RECOVERY_CHECKLIST.md](./PRODUCTION_RECOVERY_CHECKLIST.md)

---

## 1. Scope & objectives

This plan covers recovery of ZOLANZO production (and staging) after loss or corruption of:

- Postgres (Supabase)
- Object storage (Supabase Storage)
- Application deployment (Next.js / host)
- Secrets & configuration
- Background workers / scheduler
- Monitoring (Sentry / logs)

**Out of scope for 3A.5:** live payment-rail failover (Phase 3B), multi-region active-active, and automated restore orchestration.

### Recovery objectives (targets)

| System | RPO (data loss) | RTO (time to recover) | Notes |
| --- | ---: | ---: | --- |
| Postgres (Supabase) | ≤ 24h (plan); PITR where plan allows | ≤ 4h | Depends on Supabase plan tier |
| Storage buckets | ≤ 24h | ≤ 8h | Bucket re-create + object restore |
| App + workers | ~0 (git) | ≤ 1h | Redeploy from main / tag |
| Secrets | ~0 (vault) | ≤ 1h | If vault accessible |
| Auth (Supabase Auth) | Tied to project restore | ≤ 4h | Same project / restore |

Review these targets after the first restore drill (3A.6).

---

## 2. Systems of record

| Asset | Source of truth | Backup owner |
| --- | --- | --- |
| Schema + migration history | Git: `prisma/migrations/**` + `_prisma_migrations` in DB | Engineering |
| Application code | Git (`main` / release tags) | Engineering |
| Runtime data | Supabase Postgres project `ffvwviabpyhjeoxjxunb` (eu-west-1) | Ops / Supabase |
| Auth users | Supabase Auth (same project) | Ops / Supabase |
| Evidence / media | Supabase Storage buckets | Ops / Supabase |
| Secrets | Host env (Vercel or equivalent) — **never git** | Ops |
| Observability | Sentry project + log drain | Ops |
| Domain / DNS | Cloudflare (design) / registrar | Ops |

**Isolation rule:** Zolanzo project only. Never use BamSignal / BamSignal-Engine credentials or projects for recovery.

---

## 3. Backup strategy

### 3.1 Database (Supabase Postgres)

| Control | Procedure |
| --- | --- |
| Platform backups | Confirm Supabase **daily backups** (or PITR) enabled for production project |
| Pre-migrate snapshot | Before every production `prisma migrate deploy`, confirm recent backup / PITR window |
| Migration history | Preserve `_prisma_migrations`; never drop or rewrite applied migrations in prod |
| Logical export (optional) | Periodic `pg_dump` via `DIRECT_URL` to encrypted offsite storage (ops-owned) |

**Verify (read-only):**

```bash
# From a trusted ops machine with DIRECT_URL set
npx prisma migrate status
# Supabase Dashboard → Database → Backups: confirm schedule + last success
```

### 3.2 Storage

| Control | Procedure |
| --- | --- |
| Platform | Rely on Supabase Storage durability for primary |
| Critical buckets | Document bucket names (`constants/storage.ts`); recreate empty buckets on rebuild |
| Evidence | Evidence references are adapter-based — restore objects then validate references |
| Brand / public assets | Rebuild from git `public/` / brand pipeline if needed |

### 3.3 Environment & secrets

| Control | Procedure |
| --- | --- |
| Inventory | Canonical list: `.env.example` + strict keys in `lib/validation/env.ts` |
| Storage | Host secret store (per environment: development / staging / production) |
| Rotation | Document last rotation; after incident, rotate DB password, service role, webhook secrets, CSRF |
| Recovery | Rebuild env from vault + `.env.example`; never from chat history |

**Strict production keys (minimum):**

- `DATABASE_URL`, `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CSRF_SECRET`, `NEXT_PUBLIC_APP_URL`
- `WEBHOOK_SIGNING_SECRET` (and optional `WEBHOOK_SIGNING_SECRETS`)
- Optional: `SENTRY_DSN`, provider keys (Phase 3B)

### 3.4 Configuration & migration history

| Asset | Location |
| --- | --- |
| Prisma schema | `prisma/schema.prisma` |
| Migrations (19) | `prisma/migrations/*` including `20260726070000_rls_policies` |
| RLS source | `prisma/rls/*.sql` |
| Job schedules | `jobs/schedules.ts` |
| Feature flags | `constants/feature-flags.ts` |
| Integration catalog | `constants/integrations.ts` |

Git history **is** the configuration backup. Tags/releases pin deployable states.

### 3.5 Restore prerequisites

Before attempting restore:

1. [ ] Identify incident severity and declare DR mode (see BCP)
2. [ ] Confirm which environment (staging drill vs production)
3. [ ] Access to Supabase org `zolanzo` / project ref
4. [ ] Access to host (Vercel) + DNS
5. [ ] Access to secret vault
6. [ ] Working clone of the release tag being restored
7. [ ] Communication channel for status updates
8. [ ] Freeze destructive migrations / deploys until restore complete

---

## 4. Restore procedures

### 4.1 Complete database restore (Supabase dashboard)

1. Announce freeze on writes (feature flags / maintenance if available).
2. Supabase Dashboard → **Database → Backups** → select restore point.
3. Restore into the **same** project (or into a new project if required by Supabase).
4. If new project: update all env URLs/keys; update DNS/app config.
5. Run:

```bash
npx prisma migrate status
# Expect: Database schema is up to date
```

6. Smoke: `GET /health`, `GET /readiness`, admin Command Center.
7. Spot-check: user login, one wallet projection, one campaign read.
8. Unfreeze writes; postmortem.

### 4.2 Point-in-time recovery (PITR)

Where the Supabase plan supports PITR:

1. Choose recovery timestamp **before** corruption / bad migrate.
2. Restore via dashboard PITR.
3. Re-apply any **intentional** migrations after that timestamp carefully (prefer forward-fix).
4. Validate `_prisma_migrations` matches git for that release.

If PITR is **not** on the current plan: RPO falls back to daily backup; escalate plan upgrade as residual risk.

### 4.3 Storage recovery

1. List expected buckets from `constants/storage.ts`.
2. Recreate missing buckets (private vs public policies as designed).
3. Restore objects from Supabase backup / offsite dump if available.
4. For evidence: verify a sample of `EvidenceReference` resolves via storage adapter.
5. If objects lost permanently: mark affected submissions for ops review (do not invent data).

### 4.4 Environment rebuild

1. Create empty `.env` from `.env.example`.
2. Fill from vault (never from Slack/chat).
3. `npx prisma validate`
4. `npm run typecheck && npm test`
5. Deploy with host env vars set to match.
6. Confirm `/readiness` environment check is `ok`.

### 4.5 Fresh deployment recovery (app + workers)

```bash
git fetch --tags
git checkout <release-tag>
npm ci
npx prisma migrate deploy   # only if DB needs migrations; never against wrong project
npm run build
# Host: promote previous deployment OR redeploy tag
# Workers:
ZOLANZO_CRON_ENABLED=0 npm run jobs:cron   # dedicated process recommended
```

Verify:

- `/health` → 200
- `/readiness` → not `down`
- Cron runner health via readiness `scheduler` / `background_workers`
- Sentry receiving events (if `SENTRY_DSN` set)

### 4.6 Schema-only rebuild (empty DB)

Use when the project is empty but code is intact (new region / new project):

```bash
# DIRECT_URL + DATABASE_URL point at NEW empty Zolanzo project only
npx prisma migrate deploy
npx prisma migrate status
# Apply is already included for RLS migration 20260726070000_rls_policies
```

Then seed only if approved (`npm run db:seed` — **not** for production without policy).

---

## 5. Validation of rebuild-from-repo

| Check | How |
| --- | --- |
| Repo builds | `npm ci && npm run typecheck && npm test && npm run build` |
| Migrations reproducible | Ordered folders under `prisma/migrations`; `migrate deploy` on empty Postgres |
| Env documented | `.env.example` + `docs/DEPLOYMENT.md` + this plan |
| Dependencies | `package.json` / lockfile; Node version per host |
| Workers | `npm run jobs:cron`; schedules in `jobs/schedules.ts` |
| Health | `/health`, `/readiness`, admin health footer |

---

## 6. Roles & communication

| Role | Responsibility |
| --- | --- |
| Incident Commander | Declares DR, approves restore, communicates status |
| Database operator | Supabase restore, migrate status |
| App operator | Deploy / rollback / env |
| Finance liaison | Freeze withdrawals/payments if money risk |
| Comms | Status page / stakeholder updates |

---

## 7. Drill cadence

| Drill | Cadence | Environment |
| --- | --- | --- |
| Document review | Quarterly | — |
| Staging restore from backup | Semi-annual | Staging |
| Env rebuild from vault + `.env.example` | Semi-annual | Staging |
| Full production simulation | Annual (3A.6+) | Staging first |

Record drill results in `docs/PHASE_3A5_DR_REPORT.md` addenda or a dated ops note.

---

## 8. Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [INFRASTRUCTURE.md](./INFRASTRUCTURE.md)
- [RELIABILITY.md](./RELIABILITY.md)
- [OBSERVABILITY.md](./OBSERVABILITY.md)
- [INITIAL_DATABASE_PROVISIONING_REPORT.md](./INITIAL_DATABASE_PROVISIONING_REPORT.md)
- [RLS.md](./RLS.md)
