# Phase 3B.3 — Sendchamp Communication Platform Report

**Date:** 2026-07-26  
**Status:** Complete (stub-safe; **await `SENDCHAMP_API_KEY` before live delivery**)  
**Constraint honored:** Domain never imports Sendchamp — all vendor I/O behind `NotificationChannelAdapter`

---

## Executive summary

Sendchamp is the production SMS + WhatsApp channel. Delivery, webhook lifecycle (queued / delivered / failed / rejected / read), hub templates for auth/payment/marketplace/campaign/security events, retry → dead-letter, optional SMS→email fallback, and Command Center Communication Health are implemented.

**Live HTTP activates only when `SENDCHAMP_API_KEY` is set.** Without keys the adapter stays in stub mode so local/CI remain green.

---

## 1. Architecture

```
Domain → emitNotificationFromDomainEvent / createNotificationIntent
       → NotificationJob queue
       → NotificationChannelAdapter.deliver
       → SendchampAdapter (live | stub)   // sms + whatsapp
       → POST /api/webhooks/sendchamp (lifecycle)

Parallel email path (unchanged):
       → ResendAdapter
```

| Port | Implementation |
| --- | --- |
| `NotificationChannelAdapter` | `SendchampAdapter` (`sms`, `whatsapp`) |
| Future | Firebase / FCM / Twilio — same port |

---

## 2. Features

| Feature | Status |
| --- | :---: |
| SMS via Sendchamp HTTP | ✅ |
| WhatsApp via Sendchamp HTTP | ✅ |
| Stub mode without API key | ✅ |
| Correlation IDs on deliver / webhooks | ✅ |
| Idempotency (intent + job keys) | ✅ |
| Retry + backoff (shared hub policy) | ✅ |
| Circuit breaker | ✅ |
| Timeouts (client AbortController) | ✅ |
| SMS / WhatsApp queue (`NotificationJob`) | ✅ |
| Dead-letter (`dead_lettered`) | ✅ |
| Scheduling + priority (hub) | ✅ |
| WhatsApp templates (hub `whatsappTemplate`) | ✅ |
| Media-ready (body + optional media vars) | ✅ |
| Webhook signature verify | ✅ |
| Delivery tracking via webhooks | ✅ |
| Fallback SMS→email (policy) | ✅ |
| Communication Health (Command Center) | ✅ |

---

## 3. Supported events

Hub events with SMS and/or WhatsApp templates (plus existing email/in_app where applicable):

| Category | Events |
| --- | --- |
| Authentication | `auth.otp`, `auth.login_verification`, `auth.password_reset`, `auth.welcome`, `auth.email_verification`, `auth.magic_link` |
| Payments | `payment.receipt`, `payment.refund_processed`, `withdrawal.requested`, `withdrawal.approved`, `withdrawal.completed` |
| Marketplace | `marketplace.offer_received`, `marketplace.listing_approved`, `marketplace.listing_rejected` |
| Campaigns | `assignment.received`, `assignment.reminder`, `assignment.expired` |
| Security | `security.new_device`, `security.password_changed`, `security.suspicious_activity`, `security.alert` |

Domain services must **emit** these hub events on the corresponding UX paths; templates and channel adapters are ready.

---

## 4. Provider adapter

| Path | Role |
| --- | --- |
| `lib/integrations/notifications/sendchamp/client.ts` | HTTP client, timeouts, live/stub gate |
| `lib/integrations/notifications/sendchamp/circuit.ts` | Circuit breaker |
| `lib/integrations/notifications/sendchamp/signature.ts` | Webhook HMAC / platform auth |
| `lib/integrations/notifications/sendchamp/normalize.ts` | Lifecycle normalize |
| `lib/integrations/notifications/sendchamp-adapter.ts` | `NotificationChannelAdapter` |

Selection: `preferLive` + `sms`/`whatsapp` → Sendchamp when keyed, else memory stub.

---

## 5. Queue integration

1. Intent → channel jobs (`sms` / `whatsapp` / `email` / …)
2. Job due → adapter `deliver`
3. Success → `delivered` (or `queued` in stub)
4. Failure → reschedule with backoff
5. Attempts exhausted → **`dead_lettered`**
6. Cron `notifications.retry` dispatches due jobs (shared with email)

Priority and `scheduledFor` are honored by the existing hub scheduler.

---

## 6. Webhook support

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/webhooks/sendchamp` | Signed status updates |

Normalized statuses include: **queued**, **delivered**, **failed**, **rejected**, **read** (WhatsApp).

Configure in Sendchamp after keys: `{APP}/api/webhooks/sendchamp` + `SENDCHAMP_WEBHOOK_SECRET` (or platform `WEBHOOK_SIGNING_SECRET`).

---

## 7. Fallback strategy

| Primary fails (DLQ) | Fallback (when enabled) |
| --- | --- |
| SMS | Email |
| WhatsApp | SMS, then Email |

- Policy: `features/notifications/services/fallback.ts`
- Default on; disable with `ZOLANZO_SMS_EMAIL_FALLBACK=0`
- Encouraged for `auth.*`, `payment.*`, `withdrawal.*`, `security.*`
- Fallback enqueues a new job on the same intent with a distinct idempotency key

---

## 8. Admin — Communication Health

Command Center panel shows:

- SMS sent · WhatsApp sent · Failures · Retries · DLQ  
- Delivery rate · Latency  
- Provider mode (`live` / `stub`) · Circuit state · Provider status  

---

## 9. Environment variables

| Key | Live required | Notes |
| --- | :---: | --- |
| `SENDCHAMP_API_KEY` | Yes | Enables live SMS/WhatsApp |
| `SENDCHAMP_SENDER_ID` | Recommended | SMS sender name (default `Zolanzo`) |
| `SENDCHAMP_WHATSAPP_SENDER` | Yes for WhatsApp | WhatsApp business sender |
| `SENDCHAMP_WEBHOOK_SECRET` | Yes for webhooks | Falls back to `WEBHOOK_SIGNING_SECRET` |
| `ZOLANZO_SMS_EMAIL_FALLBACK` | No | Default on; set `0` to disable |

---

## 10. Tests

| Suite | Coverage |
| --- | --- |
| `sendchamp-adapter.test.ts` | OTP / payment / withdrawal templates, webhook verify, duplicate/replay, normalize, stub/live deliver, circuit, fallback policy, retry schedule |
| `notification-hub.test.ts` | Sendchamp capabilities (`sms`, `whatsapp`); hub wiring |

**Full suite:** **270** tests passed · typecheck clean.

---

## 11. Provider health

| Signal | Source |
| --- | --- |
| Mode live/stub | `SENDCHAMP_API_KEY` presence |
| Circuit open/closed | In-process breaker |
| Queue / DLQ / delivery rate | `NotificationJob` aggregates |
| Latency | Observability metrics snapshot |

---

## 12. Known limitations

1. Live delivery gated on `SENDCHAMP_API_KEY` (intentional).
2. WhatsApp live send also needs `SENDCHAMP_WHATSAPP_SENDER`.
3. Domain flows must **emit** hub events when auth/payment/marketplace UX goes live.
4. Circuit + webhook replay cache are process-local (same platform pattern).
5. Rich WhatsApp media is template-variable ready; full asset upload pipeline is out of scope for this slice.
6. Push (FCM/Firebase) not implemented — adapter port remains ready.

---

## 13. Production readiness

| Gate | Status |
| --- | :---: |
| Adapter behind port | ✅ |
| SMS + WhatsApp templates for required events | ✅ |
| Queue + retry + DLQ | ✅ |
| Webhook status updates | ✅ |
| Fallback policy | ✅ |
| Admin Communication Health | ✅ |
| Unit tests | ✅ |
| Live key configured | ⏳ Operator |
| Staging E2E journeys | ⏳ 3B.4 |

### Verdict

**Phase 3B.3 implementation complete.**  
**STOP — wait for `SENDCHAMP_API_KEY` (and WhatsApp sender / webhook secret) before enabling live delivery.**

**Provider wave complete for launch:** Paystack · Resend · Sendchamp (SMS/WhatsApp).  
Next recommended: **Phase 3B.4 — End-to-End Business Journey Validation** (not another provider).

---

## STOP
