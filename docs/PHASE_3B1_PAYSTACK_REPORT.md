# Phase 3B.1 — Paystack Production Integration Report

**Date:** 2026-07-26  
**Status:** Complete (stub-safe; **await API keys before live mode**)  
**Constraint honored:** Domain never imports Paystack SDK — all vendor I/O behind `PaymentProviderAdapter`

---

## Executive summary

Paystack is the first production-grade payment integration. Initialization, browser callback validation, webhook verification (HMAC-SHA512 + replay), ledger posting (webhook-only), refunds, nightly reconciliation, and Command Center Payment Health are implemented.

**Live HTTP calls activate only when `PAYSTACK_SECRET_KEY` is set.** Without keys the adapter remains in stub mode so local/CI stay green.

---

## 1. Features implemented

| Capability | Status |
| --- | :---: |
| Payment initialization (unique ref, metadata, idempotency, org context) | ✅ |
| Browser callback (validate reference/amount/currency/status — **no ledger writes**) | ✅ |
| Webhook HMAC-SHA512 + event id replay + event schema/version | ✅ |
| Events: charge/transfer/refund/subscription/invoice (+ unknown → log only) | ✅ |
| Ledger updates only after verified webhook + provider verify | ✅ |
| Nightly Paystack reconciliation job + persisted report | ✅ |
| Full / partial refund request + ledger reversal on `refund.processed` | ✅ |
| Admin Payment Health (pending, failed, recent, recon, webhooks) | ✅ |
| Future-ready purposes: `marketplace_payment`, `subscription` | ✅ |

---

## 2. Architecture

```
User → createDomainPaymentIntent → PaymentProviderAdapter (Paystack)
     → Paystack Checkout
     → GET /api/payments/callback   (validate only)
     → POST /api/webhooks/paystack  (verify → normalize → ledger)
     → applySuccessfulFunding / applyPaymentRefundLedger
     → Notification intent (campaign.funded)
```

Provider selection prefers live Paystack when keys are present; otherwise memory/stub adapters continue to work.

---

## 3. Endpoints

| Method | Path | Auth | Role |
| --- | --- | --- | --- |
| `POST` | `/api/webhooks/paystack` | Paystack signature | Public ingress |
| `GET` | `/api/payments/callback` | None | Public return URL — **no money movement** |
| Server action | `createPaymentIntentAction` | Session | Create intent |
| Server action | `verifyPaymentAction` | Session + access | Ops verify (still goes through verify path) |
| Server action | `requestPaymentRefundAction` | `payments.refund` | Initiate refund |

**Paystack dashboard configuration (when keys arrive):**

- Webhook URL: `{NEXT_PUBLIC_APP_URL}/api/webhooks/paystack`
- Callback URL: `{NEXT_PUBLIC_APP_URL}/api/payments/callback`

---

## 4. Webhook events

| Paystack event | Normalized type | Ledger? |
| --- | --- | :---: |
| `charge.success` | `payment.succeeded` | ✅ after verify |
| `transfer.success` | `transfer.succeeded` | Log only |
| `transfer.failed` | `transfer.failed` | Log only |
| `refund.processed` | `payment.refunded` | ✅ reversal |
| `subscription.create` | `subscription.created` | Log only (future) |
| `subscription.disable` | `subscription.disabled` | Log only |
| `invoice.create` | `invoice.created` | Log only |
| `invoice.payment_failed` | `invoice.payment_failed` | Log only |
| unknown | — | Log only |

Security checks: signature · replay (event id) · amount/currency match · provider `verify` before funding · idempotent `PaymentEvent.idempotencyKey`.

---

## 5. Security verification

| Control | Implementation |
| --- | --- |
| HMAC | Paystack **SHA-512** of raw body (`x-paystack-signature`) |
| Replay | `assertNotReplay` on Paystack event id |
| Timestamp skew | Optional `paid_at` / `created_at` window (15m) |
| Callback trust | Callback validates only; **never** posts journals |
| Idempotency | Payment intent key + event idempotency keys |
| Fail-closed | Missing secret / bad signature → `401` / empty events |

---

## 6. Reconciliation

- Job: `payments.reconcile-paystack` (`30 2 * * *` UTC)
- Compares internal `PaymentIntent`/`PaymentRecord` vs Paystack transaction list (live) or internal consistency (stub)
- Detects: missing internal, missing provider, amount mismatch, duplicate records
- Persists latest report: `DashboardSnapshot` key `payment_reconciliation:paystack:latest`
- Surfaced in Command Center Payment Health

---

## 7. Files created

| Path |
| --- |
| `lib/integrations/payments/paystack/client.ts` |
| `lib/integrations/payments/paystack/signature.ts` |
| `lib/integrations/payments/paystack/normalize.ts` |
| `lib/integrations/payments/paystack/paystack-adapter.test.ts` |
| `features/payments/services/refunds.ts` |
| `features/payments/services/reconciliation.ts` |
| `features/payments/services/paystack-integration.test.ts` |
| `features/admin/services/payment-health.ts` |
| `app/api/webhooks/paystack/route.ts` |
| `app/api/payments/callback/route.ts` |
| `docs/PHASE_3B1_PAYSTACK_REPORT.md` |

---

## 8. Files modified

| Path | Change |
| --- | --- |
| `lib/integrations/payments/paystack-adapter.ts` | Live adapter (+ stub fallback) |
| `lib/integrations/payments/index.ts` | Prefer live Paystack |
| `lib/integrations/types.ts` | Extended events + refund/list APIs |
| `constants/payment.ts` | Purposes + event types |
| `constants/integrations.ts` | Paystack `default` |
| `features/payments/services/payment-platform.ts` | Amount checks, refunds, notify |
| `features/payments/actions/payment-actions.ts` | Refund action |
| `features/admin/services/command-center.ts` | `paymentHealth` |
| `features/admin/services/health.ts` | Paystack ready when keyed |
| `app/admin/page.tsx` | Payment Health panel |
| `jobs/names.ts` / `schedules.ts` / `handlers/critical.ts` | Reconcile job |
| `jobs/runner/cron-runner.ts` | Skip advisory lock in tests |
| `lib/auth/route-policy.ts` | Public webhook/callback |
| `lib/validation/env.ts` / `.env.example` | Paystack keys |
| `lib/observability/metrics.ts` | `payment.refunded` |
| `docs/ROADMAP.md` | 3B.1 complete |

---

## 9. Database changes

None. Reconciliation uses existing `DashboardSnapshot`. Payment models from Sprint 12 reused.

---

## 10. Environment variables

| Key | Required for live | Notes |
| --- | :---: | --- |
| `PAYSTACK_SECRET_KEY` | Yes | Enables live mode + webhook verify |
| `PAYSTACK_PUBLIC_KEY` | Recommended | Client checkout / future UI |
| `WEBHOOK_SIGNING_SECRET` | No for Paystack HMAC | Still used by other stub providers |
| `NEXT_PUBLIC_APP_URL` | Yes | Callback / webhook absolute URLs |

---

## 11. Tests / coverage

| Suite | Focus |
| --- | --- |
| `paystack-adapter.test.ts` | Signature, replay, parse, verify amount mismatch, init, refund, selection |
| `paystack-integration.test.ts` | Refund journals, idempotent keys, event map coverage |
| Existing `payment-platform.test.ts` | Still green (stub path) |

**Full suite:** 242 passed · typecheck clean

Covered scenarios from brief: successful parse · duplicate/replay · invalid signature · callback-vs-webhook separation (callback has no ledger API) · refund templates · reconciliation event set.

---

## 12. Known limitations

1. **Live mode gated on keys** — do not switch Paystack dashboard to live until secrets are in staging/prod host env.
2. **Wallet projection for `wallet_topup`** — capture journal credits `client_liability`; dedicated client-wallet projection refresh remains a follow-up (capture already posts).
3. **Transfers / subscriptions / invoices** — normalized + logged; payout rail and billing product flows deferred.
4. **Marketplace payment** — purpose accepted; same capture path as org funding until marketplace settlement product lands.
5. **Notification channels** — `campaign.funded` emitted as `in_app` intent; email/SMS wait for 3B.2/3B.3.
6. **Replay cache** — process-local (same as platform webhook auth); multi-instance needs Redis later.

---

## 13. Production readiness

| Gate | Status |
| --- | :---: |
| Adapter behind port | ✅ |
| Webhook fail-closed | ✅ |
| Ledger only after verify | ✅ |
| Callback non-authoritative | ✅ |
| Admin visibility | ✅ |
| Nightly reconcile scheduled | ✅ |
| Unit tests | ✅ |
| Live keys configured | ⏳ Operator |
| Staging E2E charge | ⏳ After keys (3B.5) |

### Verdict

**Phase 3B.1 implementation complete.**  
**STOP — wait for Paystack API keys before switching to live mode.**

Next: Phase 3B.2 Resend.

---

## STOP
