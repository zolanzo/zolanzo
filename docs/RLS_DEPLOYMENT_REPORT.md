# ZOLANZO — RLS Deployment Report

**Date:** 2026-07-26  
**Project:** `ffvwviabpyhjeoxjxunb` (eu-west-1)  
**Migration:** `20260726070000_rls_policies`  
**Method:** `npx prisma migrate deploy` (pending migration only)

---

## 1. Pre-deploy status

| Check | Result |
| --- | --- |
| Migrations in repo | 19 |
| Applied on remote (before) | 18 |
| Pending | `20260726070000_rls_policies` |

No existing migrations were modified. No new migrations were created.

---

## 2. Deployment

```text
Applying migration `20260726070000_rls_policies`
All migrations have been successfully applied.
```

### Post-deploy

```text
npx prisma migrate status
→ Database schema is up to date!
```

| Check | Result |
| --- | --- |
| Migration completed | ✅ |
| Pending migrations | **0** |

---

## 3. Verification results

Queried live Postgres (`pg_policies` / `pg_class.relrowsecurity`):

| Metric | Value |
| --- | ---: |
| Policy count (`public`) | **103** |
| Tables with RLS enabled | **73** |
| Helper functions (`zolanzo_*`) | **15** |

### Helpers present

- `zolanzo_current_user_id`
- `zolanzo_has_platform_role`
- `zolanzo_is_platform_admin`
- `zolanzo_is_platform_staff`
- `zolanzo_is_finance_staff`
- `zolanzo_is_reviewer_staff`
- `zolanzo_is_org_member` / `zolanzo_is_org_admin`
- `zolanzo_can_manage_org_ops`
- `zolanzo_is_campaign_member`
- `zolanzo_campaign_org_id`
- `zolanzo_is_assignment_party`
- `zolanzo_submission_accessible`
- `zolanzo_wallet_accessible`
- `zolanzo_payment_intent_accessible`

### Tables protected (RLS enabled)

Includes domain tables such as: `users`, `profiles`, `sessions`, `organizations`, `organization_members`, `campaigns`, `task_templates`, `task_instances`, `assignments`, `submissions`, `wallets`, `wallet_projections`, `ledger_journals`, `ledger_entries`, `payment_intents`, `withdrawal_requests`, `notification_intents`, `review_decisions`, `settlements`, plus ops/AI/validation/evidence tables, and `public_id_counters` / `_prisma_migrations`.

Full list: 73 relations with `relrowsecurity = true` (verified via SQL).

### Application startup checks

| Check | Result |
| --- | --- |
| DB reachable after deploy | ✅ |
| `prisma migrate status` up to date | ✅ |
| Env parse (`loadEnv`) | ✅ |
| Production build | ✅ |
| `GET /health` | ✅ `ok` |
| Prisma app path (service role / direct) | Unchanged — RLS is Data API defense-in-depth |

---

## 4. Security notes

- Policies enforce org/member/staff least-privilege for PostgREST / anon / authenticated access.
- Application continues to use Prisma with privileged DB credentials (bypass RLS), matching the established architecture.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to clients.

---

## STOP

RLS migration `20260726070000_rls_policies` is deployed and verified on Zolanzo.
