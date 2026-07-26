# Sprint 5 — Marketplace & Claim Engine Report

**Date:** 2026-07-25  
**Status:** Complete  

---

## 1. Features implemented

- Work Opportunities marketplace (available-only, search/filter/sort/cursor pagination)
- Eligibility evaluation against worker context + merged constraints/scopes
- Claim policies (concurrency, cooldown, invite, org-only, FCFS, future stubs)
- Reservation engine (default 2 minutes, atomic hold, expiry release)
- Assignment creation (`ASN-…`) from confirmed reservation
- Claim flow: reserve → confirm (+ one-shot claim)
- Marketplace analytics (available/reserved/claimed, claim rate, timeout rate)
- Campaign `claimPolicies` + `reservationTimeoutSeconds`

## 2. Files created

- `features/task-marketplace/**` (types, validators, services, actions, tests)
- `features/assignments/{types,repositories,actions,services}`
- `constants/claim-policies.ts`
- `.cursor/rules/marketplace-principle.mdc`
- Docs: MARKETPLACE, CLAIM_ENGINE, RESERVATION_ENGINE, ASSIGNMENT_MODEL, ELIGIBILITY
- Migration `20260725260000_marketplace_claims`
- `docs/SPRINT_5_MARKETPLACE_REPORT.md`

## 3. Files modified

- `prisma/schema.prisma` — Reservation, Assignment, campaign claim fields
- `features/campaigns/**` — claimPolicies / reservationTimeoutSeconds plumbing
- `docs/ROADMAP.md`, `docs/WORKFLOW.md`
- Feature READMEs

## 4. Database models

`Reservation`, `Assignment` (+ enums); Campaign claim policy columns

## 5. Migrations

`prisma/migrations/20260725260000_marketplace_claims/migration.sql`

## 6. Marketplace services

Browse Work Opportunities; analytics; category labels

## 7. Reservation engine

Atomic reserve; expire/release back to available

## 8. Assignment engine

Create from reservation with pinned template version + ASN public ID

## 9. Tests

`marketplace-engine.test.ts` — eligibility, claim policies, concurrency model, public IDs

## 10. Documentation

Listed in §2

## 11. Performance considerations

- Available-only indexed queries (`campaignId,status`, status)
- Cursor pagination on `(createdAt, id)`
- Atomic `updateMany` for claim races
- Expire batch capped at 500 per run

## 12. Security considerations

- Auth required for mutations
- Worker id taken from session on actions
- Eligibility + claim policy gates before reserve
- Unique assignment per task instance
- RLS enabled on reservations/assignments (policies later)

## 13. Sprint completion %

**~97%** (lottery/priority trust deferred; no UI shell)

## 14. Production readiness

Claim path ready for Assignment execution sprints. Submission/wallet not in scope.

## 15. Technical debt

- Lottery / priority-trust policies are stubs
- Browse eligibility filter is post-query (optimize with SQL later)
- No background cron for reservation expiry (invoked on browse/claim)
- Worker trust/skills still passed via context (profile enrichment later)
- RLS policies not authored

---

## Verification

`npm run verify`
