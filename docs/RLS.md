# Row Level Security (RLS)

Phase 3A.3 delivers **helpers + least-privilege policies** for defense-in-depth on the Supabase Data API. Application auth/RBAC remains the primary gate for Prisma server paths (service role / DB owner bypasses RLS).

## Intent

| Table group | Intended access |
| --- | --- |
| `users` / `profiles` / `sessions` / `devices` | Self; platform admins/staff as documented |
| `organizations` / members / invitations | Members read; admins manage |
| `roles` / `permissions` / `role_permissions` | Authenticated read; admin write |
| `user_roles` | Self read; admin assign |
| `feature_flags` | Anon: enabled only; authenticated read; admin write |
| `audit_logs` | Actor / org admin / platform staff |
| Campaigns / marketplace / assignments / submissions | Org members, workers (own), reviewers/staff |
| Wallets / ledger / payments / withdrawals | Owner / org member / finance staff — **no client write policies** |
| Notifications | Recipient / org / staff |
| Operations / AI | Staff / org-scoped configs |
| `public_id_counters` / `_prisma_migrations` | Deny anon + authenticated (service-role only) |

## Auth link

Supabase `auth.uid()` maps to `users.auth_subject` via helpers:

```sql
public.zolanzo_current_user_id()  -- auth.uid()::text → users.id
public.zolanzo_is_org_member(org_id)
public.zolanzo_is_org_admin(org_id)
public.zolanzo_wallet_accessible(wallet_id)
-- … see prisma/rls/0002_rls_helpers.sql
```

## Files

| File | Role |
| --- | --- |
| `prisma/rls/0001_rls_framework.sql` | Sprint 1 ENABLE RLS placeholders |
| `prisma/rls/0002_rls_helpers.sql` | SECURITY DEFINER helpers |
| `prisma/rls/0003_rls_policies.sql` | CREATE POLICY statements |
| `prisma/migrations/20260726070000_rls_policies/` | Deployable migration bundling helpers + policies |

## Rules

1. Service role bypasses RLS — keep it server-only.  
2. Do not disable RLS in production to “fix” bugs.  
3. Money / ledger / withdrawal mutations have **no** authenticated write policies — only via server/service role.  
4. Prefer fixing app-layer IDOR with `lib/auth/resource-guards` even when RLS would also deny.  
