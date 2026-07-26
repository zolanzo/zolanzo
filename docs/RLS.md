# Row Level Security (RLS)

Sprint 1 delivers an **RLS framework**, not full policy coverage.

## Intent

| Table | Intended access |
| --- | --- |
| `users` | Self read/update; platform admins manage all |
| `profiles` | Self manage; public fields readable later via views |
| `organizations` | Members read; owners/admins write |
| `organization_members` | Members read; admins manage |
| `sessions` / `devices` | Owner only |
| `audit_logs` | Org auditors + platform admins |
| `roles` / `permissions` / `role_permissions` | Authenticated read; admin write |
| `user_roles` | Self read; admin assign |
| `feature_flags` | Read enabled; admin manage |

## Auth link

Supabase `auth.uid()` maps to `users.auth_subject`. Policies will compare:

```sql
auth.uid()::text = (SELECT auth_subject FROM users WHERE id = ...)
```

## Files

- Framework SQL: `prisma/rls/0001_rls_framework.sql`
- Bundled as a follow-up migration step (see `prisma/migrations/*_rls_framework`)

## Rules

1. Service role bypasses RLS — keep it server-only.  
2. Do not disable RLS in production to “fix” bugs.  
3. Full policies land with Sprint 1 Part 2 (authentication).  
