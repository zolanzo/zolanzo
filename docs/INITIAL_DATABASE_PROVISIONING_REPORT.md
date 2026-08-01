# ZOLANZO — Initial Database Provisioning Report

**Date:** 2026-07-26  
**Target:** Supabase project `ffvwviabpyhjeoxjxunb` (`zolanzo's Project`, `eu-west-1`)  
**Method:** `prisma migrate deploy` (Prisma = temporary source of truth)  
**Forbidden actions avoided:** no schema edits, no new migrations, no `db push`, no BamSignal touch, no reset/drop  

---

## Summary

| Metric | Count |
| --- | ---: |
| Migrations applied | **18** / 18 |
| Tables created (`public`) | **73** |
| Indexes (`public`) | **304** |
| Foreign keys | **113** |
| Enums | **24** |
| Primary keys | 73 |
| Unique constraints | (included in catalog) |
| Check constraints | (present via Prisma/SQL) |
| RLS enabled tables | **73** / 73 |
| `_prisma_migrations` | **Present** |
| Schema up to date | **Yes** (`prisma migrate status`) |

---

## 1. Migrations applied (18)

All finished successfully:

1. `20260725200000_foundation`  
2. `20260725200001_rls_framework`  
3. `20260725210000_auth_org_platform`  
4. `20260725220000_public_ids`  
5. `20260725230000_task_templates`  
6. `20260725240000_campaigns`  
7. `20260725250000_task_instances`  
8. `20260725260000_marketplace_claims`  
9. `20260725270000_assignment_workspace`  
10. `20260725280000_submission_packages`  
11. `20260725290000_validation_engine`  
12. `20260725295000_review_engine`  
13. `20260726010000_settlement_ledger_engine`  
14. `20260726020000_withdrawal_engine`  
15. `20260726030000_payment_platform`  
16. `20260726040000_notification_hub`  
17. `20260726050000_operations_console`  
18. `20260726060000_ai_plugin_platform`  

Post-deploy: **Database schema is up to date.**

---

## 2. Tables created

**73** base tables in `public`, including `_prisma_migrations` and domain tables spanning auth/org, campaigns, marketplace, assignments, submissions, validation/review, ledger/escrow/wallets, withdrawals, payments, notifications, operations, and AI plugins.

---

## 3. Indexes

**304** indexes in `public` (primary, unique, and secondary indexes from migrations).

---

## 4. Foreign keys

**113** foreign-key constraints in `public`.

---

## 5. Enums

**24** PostgreSQL enums in `public` (Prisma-generated / migration-defined domain enums).

---

## 6. Extensions enabled

Observed on the database:

| Extension | Notes |
| --- | --- |
| `plpgsql` | Default |
| `pgcrypto` | Crypto helpers |
| `uuid-ossp` | UUID generation |
| `pg_stat_statements` | Supabase / Postgres stats |
| `supabase_vault` | Supabase platform |

No extension changes were made outside what migrations / platform already provide.

---

## 7. Warnings

1. **RLS is enabled on all 73 public tables, but policies were not created by these migrations** (known Phase 3A audit finding SEC-3). App currently relies on server-side auth/RBAC, not Postgres policies.  
2. **`DIRECT_URL` uses Supabase session pooler** (`aws-0-eu-west-1.pooler.supabase.com:5432`) because direct `db.*.supabase.co` was unreliable from this network (IPv6). Suitable for migrate; prefer dedicated direct connectivity in production when IPv4 add-on / network allows.  
3. **Database password was previously shared in chat** — rotate in Supabase when convenient.  
4. **No seed data** was applied (`db:seed` not run).  

---

## 8. Production readiness

| Gate | Status |
| --- | --- |
| Empty DB provisioned via Prisma | ✅ |
| All 18 migrations applied | ✅ |
| Migration history table present | ✅ |
| Schema matches migrate status | ✅ |
| Isolated from BamSignal-Engine | ✅ |
| RLS policies for Data API | ❌ Still open (security follow-up) |
| Auth redirect / storage buckets | ❌ Not configured in this step |
| Password rotation | ⚠ Recommended |

**Verdict:** Initial **schema provisioning is complete and healthy** for continued Phase 3A work. Not yet launch-ready (RLS policies, auth/storage ops, security audit items remain).

---

## Commands used

```bash
npx prisma validate
npx prisma migrate deploy
npx prisma migrate status
```

Verification via read-only SQL against the Zolanzo connection (table/index/FK/enum/extension counts).

---

## STOP

Provisioning finished. Awaiting further instructions.
