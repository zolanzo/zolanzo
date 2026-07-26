# Identity Architecture

> Step 4 — design only. No authentication implementation.

## Mission

ZOLANZO identity supports **individuals and organizations** as first-class actors. Demand-side language is **Client** (posts work). Supply-side is **Worker** (completes work).

### Auth vs identity verification

| Owned by ZOLANZO | Consumed via adapter (Stankings Passport) |
| --- | --- |
| Login, sessions, MFA hooks | KYC / government ID |
| Organizations, membership | Business verification |
| Roles, permissions, profiles | Face verification (future) |
| Local trust *gates* (policy) | Verified identity status & trust score signals |

Never implement a parallel KYC engine inside ZOLANZO. See [ECOSYSTEM_SERVICES.md](./ECOSYSTEM_SERVICES.md).

## Account types

| Account type | Meaning |
| --- | --- |
| Guest | Unauthenticated browse |
| Individual | Person account (may be Worker, Client, or both) |
| Organization | Tenant entity with members, shared wallet/billing |
| Developer | API / OAuth / webhook consumers |
| Moderator | Trust operations |
| Support | Support agent |
| Admin | Platform admin |
| Super Admin | Break-glass platform control |

Participation (`worker` | `client` | `both`) is **orthogonal** to account type.

## Conceptual ERD

```
User ──1:1── PublicProfile
  │      └── PrivateProfile
  │      └── UserReputation
  │      └── SkillProfile
  │
  ├──0..1── WorkerProfile
  ├──0..1── ClientProfile (individual clients)
  ├──0..1── DeveloperProfile
  │
  ├──*──── AuthIdentity (email, oauth, phone, …)
  ├──*──── Session
  ├──*──── TrustedDevice
  ├──*──── MfaMethod
  ├──*──── LoginHistory
  │
  └──*──── OrganizationMembership *──── Organization
                                            │
                                            ├──* Team
                                            ├──* Workspace (future)
                                            ├──1 Shared Wallet
                                            ├──1 BillingAccount
                                            ├──* ApiKey
                                            ├──* AuditLog
                                            └──0..1 ClientProfile (org as employer)
```

## Source files

| Concern | Location |
| --- | --- |
| Domain IDs / actors | `types/domain.ts` |
| Identity models | `types/identity.ts` |
| Platform roles | `constants/roles.ts` |
| Org roles | `constants/org-roles.ts` |
| Auth methods | `constants/auth-methods.ts` |
| Trust | `constants/trust.ts` |
| Client kinds | `constants/client-kinds.ts` |
| Access helpers | `lib/rbac/access.ts` |

## Client vs Advertiser

| User-facing | Internal / legacy |
| --- | --- |
| **Client** | `client` role, `features/clients` |
| Deprecated: Advertiser | `advertiser` alias → normalizes to `client` |

## Related docs

- [AUTH_FLOW.md](./AUTH_FLOW.md)
- [TENANCY_MODEL.md](./TENANCY_MODEL.md)
- [TRUST_SYSTEM.md](./TRUST_SYSTEM.md)
- [SECURITY_MODEL.md](./SECURITY_MODEL.md)
- [IDENTITY_REPORT.md](./IDENTITY_REPORT.md)
