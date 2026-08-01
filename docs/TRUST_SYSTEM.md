# Trust System

Source tokens: `constants/trust.ts` · engine: `lib/trust/` · passport: `lib/trust/passport/` · [PHASE_4_2A](./PHASE_4_2A_TRUST_FOUNDATION.md) · [PHASE_4_2B](./PHASE_4_2B_TRUST_PERSISTENCE.md) · [PHASE_4_2C](./PHASE_4_2C_TRUST_PASSPORT.md)

## Reputation surfaces

| Score | Applies to |
| --- | --- |
| Trust Score (0–100) | Every user — from Trust Engine dimensions |
| Worker Reputation | Workers |
| Client Reputation | Clients (individuals) |
| Organization Reputation | Organizations / verified employers |

## Trust dimensions (4.2A)

Identity · Reliability · Quality · Behavior · Experience · Reputation

Overall score is a weighted blend with **time decay** on event contributions and explainable reasons.

## Verification levels

`none` → `email` → `phone` → `identity` → `kyc` → `business`

Higher levels unlock higher-value campaign types and withdrawal limits (policy later).

## Badges

- Verified Email / Phone / Identity
- Verified Worker
- Verified Employer
- Verified Business
- Verified Payment Method

## Signals (inputs)

Email/phone verification · **Passport KYC / business / identity status** · payment method · completion/approval rates · dispute rate · account age · moderation strikes · device trust · geo consistency · endorsements · fraud / appeals

ZOLANZO aggregates reputation locally but **does not** run government-ID or KYC document verification itself — those come from `IdentityVerificationProvider` (default: Stankings Passport).

## Events

`trust.score_updated` · trust engine events (`submission_approved`, `fraud_confirmed`, …) · `badge.granted` · `badge.revoked` · `kyc.submitted` · `kyc.approved` · `kyc.rejected` · `identity.verified` · `payment_method.verified`

Domain services should call `processTrustDomainEvent` — not mutate scores ad hoc.

## Policy hooks (design)

| Gate | Example requirement |
| --- | --- |
| High-value withdrawals | phone + KYC |
| Google Play / App Store campaigns | KYC + verified payment (feature-flagged) |
| Org publish at scale | verified business |
| Marketplace visibility boost | trust band ≥ established |

## Fraud detection hooks

Risk signals feed trust and auth step-up. Moderation actions decrease scores and may suspend participation.

Match Engine, Fraud Detection, Review Assistant, and Copilots should **read** Trust Engine output rather than inventing parallel reputation math.
