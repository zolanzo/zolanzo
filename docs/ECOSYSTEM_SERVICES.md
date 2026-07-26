# Ecosystem Services

ZOLANZO may consume shared **Stankings** platform services through adapters.
It remains independently deployable and vendor-swappable.

## Locked decisions (Phase 1 close)

| Concern | Owner / default |
| --- | --- |
| Authentication (login, sessions, orgs, RBAC, profiles) | **ZOLANZO** |
| Identity verification (KYC, business, trust status) | **Stankings Passport** via `IdentityVerificationProvider` |
| SMS delivery | **Notification / SmsProvider** adapter; default **Sendchamp** (YIKE account) |
| Access pattern | Adapter ports only — never call vendors from features |

Source: `constants/ecosystem.ts` · `PLATFORM_DECISIONS`

## Shared services (future consumption)

```
Stankings Ecosystem
├── Passport (Identity)
├── Notification Hub (Email / SMS / Push)
├── Payment Gateway Layer
├── AI Gateway
├── Media Service
├── Audit Service
└── Feature Flags
        ↓
ZOLANZO consumes through adapters only
```

| Service | Role for ZOLANZO |
| --- | --- |
| Stankings Passport | Verified identity across ZOLANZO, YIKE, BayRight, BamSignal |
| Notification Hub | Optional shared email/SMS/push; ZOLANZO can keep local adapters |
| Payment Gateway Layer | Optional unified payments |
| Media / Audit / Flags / Analytics / AI | Optional shared infrastructure |

## Architecture rules

See `.cursor/rules/platform-integrations.mdc`.

```
User → Stankings Passport → Verified Identity
         ↓
   ZOLANZO · YIKE · BayRight · BamSignal
```

```
Notification Service → SmsProvider → Sendchamp (default)
                                   → Termii / Twilio / Infobip (swap)
```

## Implementation timing

Wire Passport and Sendchamp adapters during **Phase 2** (auth + notifications), not by rewriting domain architecture.
