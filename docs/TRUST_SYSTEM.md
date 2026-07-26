# Trust System

Source tokens: `constants/trust.ts` · models in `types/identity.ts`

## Reputation surfaces

| Score | Applies to |
| --- | --- |
| Trust Score (0–100) | Every user |
| Worker Reputation | Workers |
| Client Reputation | Clients (individuals) |
| Organization Reputation | Organizations / verified employers |

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

Email/phone verification · **Passport KYC / business / identity status** · payment method · completion/approval rates · dispute rate · account age · moderation strikes · device trust · geo consistency

ZOLANZO aggregates reputation locally but **does not** run government-ID or KYC document verification itself — those come from `IdentityVerificationProvider` (default: Stankings Passport).

## Events

`trust.score_updated` · `badge.granted` · `badge.revoked` · `kyc.submitted` · `kyc.approved` · `kyc.rejected` · `identity.verified` · `payment_method.verified`

## Policy hooks (design)

| Gate | Example requirement |
| --- | --- |
| High-value withdrawals | phone + KYC |
| Google Play / App Store campaigns | KYC + verified payment (feature-flagged) |
| Org publish at scale | verified business |
| Marketplace visibility boost | trust band ≥ established |

## Fraud detection hooks

Risk signals feed trust and auth step-up. Moderation actions decrease scores and may suspend participation.
