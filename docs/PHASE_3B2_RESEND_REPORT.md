# Phase 3B.2 — Resend Production Email Platform Report

**Date:** 2026-07-26  
**Status:** Complete (stub-safe; **await `RESEND_API_KEY` before live delivery**)  
**Constraint honored:** Domain never imports Resend — all vendor I/O behind `NotificationChannelAdapter`

---

## Executive summary

Resend is the first production-grade email channel. Delivery, Svix webhook lifecycle (delivered / bounce / complaint / open), template expansion, retry → dead-letter, open-tracking pixel hook, and Command Center Email Health are implemented.

**Live HTTP activates only when `RESEND_API_KEY` is set.** Without keys the adapter stays in stub/queue mode so local/CI remain green.

---

## 1. Architecture

```
Domain → emitNotificationFromDomainEvent / createNotificationIntent
       → NotificationJob queue
       → NotificationChannelAdapter.deliver
       → ResendAdapter (live | stub)
       → POST /api/webhooks/resend (lifecycle)
```

Future adapters (SendGrid, SES, Postmark) plug into the same `NotificationChannelAdapter` port.

---

## 2. Features

| Feature | Status |
| --- | :---: |
| Email queue (`NotificationJob`) | ✅ |
| Retry policy (backoff + maxAttempts) | ✅ |
| Dead-letter (`dead_lettered` status) | ✅ |
| Template rendering (HTML + text) | ✅ |
| Localization-ready (`locale` on templates) | ✅ |
| Open tracking hooks (pixel + Resend open events) | ✅ |
| Delivery status via webhooks | ✅ |
| Bounce / complaint handling | ✅ |
| Idempotency (intent + job keys) | ✅ |
| Correlation IDs on webhook ingress | ✅ |

---

## 3. Templates & events

Expanded `NOTIFICATION_HUB_EVENTS` with email (+ in_app) templates:

| Category | Events |
| --- | --- |
| Auth | `auth.welcome`, `auth.email_verification`, `auth.password_reset`, `auth.magic_link` |
| Organizations | `org.invite_member`, `org.invite_accepted`, `org.invite_revoked` |
| Campaigns | `campaign.published`, `assignment.received`, `assignment.reminder`, `assignment.expired` |
| Marketplace | `marketplace.listing_approved/rejected`, `marketplace.offer_received/accepted` |
| Payments | `payment.receipt`, `payment.refund_processed`, `withdrawal.requested` (+ existing withdrawal/settlement) |
| Digests / security | `digest.daily_summary`, `digest.weekly`, `security.alert` |

Prior ops events (review, settlement, campaign.funded, etc.) retained.

---

## 4. Provider adapter

| Path | Role |
| --- | --- |
| `lib/integrations/notifications/resend/client.ts` | HTTP client |
| `lib/integrations/notifications/resend/signature.ts` | Svix HMAC verify |
| `lib/integrations/notifications/resend/normalize.ts` | Lifecycle normalize |
| `lib/integrations/notifications/resend-adapter.ts` | `NotificationChannelAdapter` |

Selection: `preferLive` + email → Resend when keyed, else memory for local delivery.

---

## 5. Endpoints

| Method | Path | Role |
| --- | --- | --- |
| `POST` | `/api/webhooks/resend` | Svix-signed delivery/bounce/complaint/open |
| `GET` | `/api/email/open` | Open-tracking pixel hook |

Configure in Resend dashboard after keys: `{APP}/api/webhooks/resend`.

---

## 6. Queue / retry / DLQ

1. Job created `scheduled` / due → `delivering`
2. Success → `delivered` (or `queued` in stub mode)
3. Failure → reschedule with backoff
4. Attempts exhausted → **`dead_lettered`** (dead-letter support)
5. Cron `notifications.retry` every 2 minutes dispatches due jobs

---

## 7. Admin — Email Health

Command Center panel shows:

- Queue size · Sent today · Failures · Retries · DLQ count  
- Bounce rate · Complaint rate (7-day window)  
- Provider mode (`live` / `stub`) and status  

---

## 8. Environment variables

| Key | Live required | Notes |
| --- | :---: | --- |
| `RESEND_API_KEY` | Yes | Enables live send |
| `RESEND_FROM_EMAIL` | Recommended | Defaults to Resend onboarding sender |
| `RESEND_WEBHOOK_SECRET` | Yes for webhooks | `whsec_…` Svix secret |

---

## 9. Tests

| Suite | Coverage |
| --- | --- |
| `resend-adapter.test.ts` | Welcome / verify / receipt templates, signature, replay, bounce normalize, live/stub deliver, retry/DLQ |
| `notification-hub.test.ts` | Updated preferLive Resend selection; all hub events have email + in_app |

**Full suite:** **256** tests passed · typecheck clean.

---

## 10. Known limitations

1. Live delivery gated on `RESEND_API_KEY` (intentional).
2. Digest job still placeholder content assembly (templates ready).
3. Auth/org/campaign flows must **emit** new hub events from domain when those UX paths go live (templates exist).
4. Replay cache remains process-local (same platform pattern).
5. Native Resend open tracking complements pixel; both optional.

---

## 11. Production readiness

| Gate | Status |
| --- | :---: |
| Adapter behind port | ✅ |
| Templates for required email types | ✅ |
| Queue + retry + DLQ | ✅ |
| Webhook bounce/complaint | ✅ |
| Admin Email Health | ✅ |
| Unit tests | ✅ |
| Live key configured | ⏳ Operator |
| Staging E2E journeys | ⏳ 3B.5 |

### Verdict

**Phase 3B.2 implementation complete.**  
**STOP — wait for `RESEND_API_KEY` (and webhook secret) before enabling live delivery.**

Next: Phase 3B.3 Sendchamp.

---

## STOP
