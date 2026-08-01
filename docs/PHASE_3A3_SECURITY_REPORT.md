# Phase 3A.3 — Security Hardening Report

**Date:** 2026-07-26  
**Scope:** Close production security blockers from [PHASE_3A_PRODUCTION_READINESS_AUDIT.md](./PHASE_3A_PRODUCTION_READINESS_AUDIT.md)  
**Mode:** App-layer authz + RLS policies + webhook crypto — no live Paystack/Sendchamp/Resend wiring  

---

## Executive verdict

| Gate | Status |
| --- | --- |
| SEC-1 Webhook authentication | ✅ Closed |
| SEC-2 Withdrawal authorization | ✅ Closed |
| SEC-3 RLS policies | ✅ Migrated (deploy pending on remote) |
| SEC-4 IDOR (high-risk surfaces) | ✅ Closed for audited actions |
| ARCH-1 Ops reservation cancel | ✅ Closed |
| Security regression tests | ✅ 17 new + suite green (207) |
| **Phase 3A.3 slice** | **Complete** — await migrate deploy + remaining residual risks |

**Updated security readiness (static):** ~**78%** (was ~53%).  
**Overall production readiness (weighted estimate):** ~**56%** (was ~47%).  
Still blocked from launch by observability (3A.4), DR (3A.5), and certification (3A.6) — not by the original Critical security list.

---

## 1. Completed issues

### 1.1 RLS (SEC-3)

- Helpers: `prisma/rls/0002_rls_helpers.sql` (`zolanzo_current_user_id`, org/finance/reviewer/wallet/submission accessors).
- Policies: `prisma/rls/0003_rls_policies.sql` — least privilege for identity, orgs, marketplace, finance (read), notifications, ops, AI.
- Money/ledger/withdrawal **writes** intentionally have no authenticated policies (service-role / Prisma only).
- Deployable migration: `prisma/migrations/20260726070000_rls_policies/`.
- Docs updated: [RLS.md](./RLS.md).

**Remote:** migration not applied in this session (await `prisma migrate deploy` approval against Zolanzo).

### 1.2 Webhook authentication (SEC-1)

New module: `lib/security/webhook-auth.ts`

| Requirement | Implementation |
| --- | --- |
| Signature verification | HMAC-SHA256 over `{timestamp}.{body}` |
| Timestamp validation | ±300s skew |
| Replay protection | In-memory event-id cache (TTL 15m) |
| Secret rotation | `WEBHOOK_SIGNING_SECRET` + `WEBHOOK_SIGNING_SECRETS` |
| Constant-time compare | `crypto.timingSafeEqual` / hex-safe fallback |
| Audit logging | Structured accept/reject via logger |

Payment stub adapters no longer accept `stub:true` or bare signature headers — fail closed without secrets.

### 1.3 Withdrawal authorization (SEC-2)

`features/withdrawals/actions/withdrawal-actions.ts`:

| Action | Gate |
| --- | --- |
| Intent / destination / confirm | `withdrawals.request` |
| Approve / process / batch | `withdrawals.approve` |
| Cancel | Auth + owner (`workerUserId`) |

Settlement process/create gated with `ops.finance.act`. Reviews gated with `submissions.review`.

### 1.4 IDOR audit (SEC-4)

| Surface | Fix |
| --- | --- |
| Submissions evidence attach/replace/remove/ready/get | Owner (`workerUserId`) / reviewer staff |
| Campaigns mutate/list/get | `assertCampaignAccess` + membership filter |
| Payments verify | `assertPaymentIntentAccess` |
| Wallet project | `wallet.read` + `assertWalletAccess` |
| Notifications prefs | Forced to self / org membership |
| Notification create/dispatch/emit | `notifications.send` |
| Profiles / orgs | Already bound to session user / org permissions |

Shared helpers: `lib/auth/resource-guards.ts`.

### 1.5 ARCH-1 reservation race

- Ops cancel now calls `forceReleaseReservation` (domain).
- Atomic `updateMany` on reservation status + restore `task_instance` to `available`.
- Concurrent double-release returns `RESERVATION_RACE` (409).
- Claim path already used conditional `updateMany` on `available` inventory.

---

## 2. Remaining risks

| Risk | Severity | Notes |
| --- | --- | --- |
| RLS migration not yet deployed to Supabase | High until deploy | Local migration ready |
| Replay cache is process-local | Medium | Redis in 3A.4 |
| Live provider HMAC formats (Paystack/Stripe quirks) | Medium | Adapter overrides in 3B |
| Some marketplace/assignment read actions still auth-only | Low–Med | Claim paths bind worker; broaden guards as UX lands |
| CSRF / Redis rate limits | Post-launch (audit) | Unchanged |
| Password rotation recommended (prior infra report) | Ops | Unchanged |

---

## 3. Files created

- `lib/security/webhook-auth.ts`
- `lib/auth/resource-guards.ts`
- `lib/security/security-hardening.test.ts`
- `prisma/rls/0002_rls_helpers.sql` (pre-existing draft → finalized for migration)
- `prisma/rls/0003_rls_policies.sql`
- `prisma/migrations/20260726070000_rls_policies/migration.sql`
- `docs/PHASE_3A3_SECURITY_REPORT.md`

## 4. Files modified

- `lib/integrations/payments/stub-factory.ts`
- `features/withdrawals/actions/withdrawal-actions.ts`
- `features/submissions/actions/submission-actions.ts`
- `features/submissions/services/submission-service.ts`
- `features/payments/actions/payment-actions.ts`
- `features/payments/services/payment-platform.test.ts`
- `features/verification/actions/review-actions.ts`
- `features/settlements/actions/settlement-actions.ts`
- `features/campaigns/actions/campaign-actions.ts`
- `features/notifications/actions/notification-actions.ts`
- `features/admin/services/operation-commands.ts`
- `features/task-marketplace/services/reservation-engine.ts`
- `features/task-marketplace/services/index.ts`
- `lib/validation/env.ts`
- `.env.example`
- `docs/RLS.md`
- `docs/ROADMAP.md`

## 5. Database changes

| Change | Detail |
| --- | --- |
| Migration | `20260726070000_rls_policies` |
| Schema redesign | None |
| New tables | None |
| Policies | CREATE POLICY across protected public tables |

## 6. New routes

None.

## 7. New environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `WEBHOOK_SIGNING_SECRET` | Yes for webhook ingress | Primary HMAC secret |
| `WEBHOOK_SIGNING_SECRETS` | Optional | Comma-separated previous secrets (rotation) |

## 8. Security implications

- Webhook spoofing → ledger credit path closed without valid HMAC.
- Finance approve/process no longer available to any authenticated user.
- Evidence / campaign / payment IDOR closed at action layer.
- RLS adds Data API defense-in-depth once migrated.
- Ops reservation cancel no longer strands inventory.

## 9. Performance considerations

- RLS helper functions are `STABLE` + `SECURITY DEFINER` with fixed `search_path`.
- Webhook replay Map is O(1); prune on write.
- Campaign list membership filter is in-memory post-query (fine until scale → push into repository filter).

## 10. Tests added

| File | Coverage |
| --- | --- |
| `lib/security/security-hardening.test.ts` | Unauthorized RBAC, IDOR guards, webhook spoof/replay/skew/rotation, ARCH-1 export |
| `payment-platform.test.ts` | Updated for signed webhooks |

**Suite:** 207 tests passed · `tsc --noEmit` clean.

## 11. Remaining TODOs

1. Deploy `20260726070000_rls_policies` to Zolanzo Supabase (`approve migrate`).
2. Set `WEBHOOK_SIGNING_SECRET` in all environments.
3. Phase **3A.4** Observability (Sentry, metrics, Redis replay store).
4. Phase **3A.5** DR · **3A.6** certification before Phase 3B live adapters.

## 12. Production readiness for this slice

**3A.3 Security Hardening: complete in repo.**  
Not launch-ready overall — proceed to **3A.4 Observability** next. Do not wire live money rails until migrate + secret configuration are verified in the target environment.

---

## STOP

Awaiting next instruction.
