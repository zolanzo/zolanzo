# Integrations

Adapter-port architecture. Implementations land in Phase 2 behind `lib/integrations/types.ts`.

## Principles

1. **Ports over vendors** — domain code talks to `EmailProvider`, `SmsProvider`, `IdentityVerificationProvider`, etc.
2. **Registry DI** — `lib/integrations/registry.ts` stays empty until wiring.
3. **Swap without rewrites** — Sendchamp ↔ Termii ↔ Twilio ↔ Infobip; Resend ↔ SMTP; Paystack ↔ Stripe; Passport ↔ alternate IDP.
4. **Secrets by env** — keys documented in `.env.example`; never hardcoded.
5. **Auth ≠ verification** — ZOLANZO owns auth; Passport owns KYC/trust verification.

## Locked defaults

| Port | Default implementation |
| --- | --- |
| `IdentityVerificationProvider` | **Stankings Passport** |
| `SmsProvider` | **Sendchamp** (YIKE account) |

## Catalog

Full list: `constants/integrations.ts` · ecosystem: `constants/ecosystem.ts`

| Category | Default / planned | Optional / future |
| --- | --- | --- |
| Platform | Supabase | — |
| Identity verification | Stankings Passport | Alternate IDP |
| OAuth | Google, GitHub, Apple, Microsoft, LinkedIn | — |
| Email | Resend | SendGrid, SMTP |
| SMS | **Sendchamp** | Termii, Twilio, Infobip |
| Push | Firebase / FCM | — |
| Payments | Paystack, Stripe, Flutterwave | Monnify |
| AI | OpenAI, Anthropic | Gemini |
| Analytics | — | PostHog |
| Observability | Sentry | — |
| Webhooks | Webhook Engine | — |

## Adapter ports

| Port | Responsibility |
| --- | --- |
| `IdentityVerificationProvider` | KYC / business / verified status (not login) |
| `EmailProvider` | Transactional + template sends |
| `SmsProvider` | OTP / alerts |
| `PushProvider` | Device push |
| `PaymentProvider` | Intent create + webhook verify |
| `AiProvider` | Completions for validation assists |
| `ObjectStorageProvider` | Put / signed URL |
| `SearchProvider` | Index / remove / query |

## Webhook engine

- Outbound: signed deliveries, retries, dead-letter
- Inbound: Passport, payments, email bounce — verified then enqueued
- Idempotency keys on payment and finance side effects

## Phase 2 wiring order (suggested)

1. Supabase  
2. Resend (or SMTP in dev)  
3. Sentry  
4. Sendchamp SMS adapter  
5. Paystack / Stripe (region-dependent)  
6. Stankings Passport (when KYC gates ship)  
7. FCM  
8. AI providers for validation assist  

See also: [ECOSYSTEM_SERVICES.md](./ECOSYSTEM_SERVICES.md)
