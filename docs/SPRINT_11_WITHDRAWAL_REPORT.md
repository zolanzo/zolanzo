# Sprint 11 — Withdrawal Engine Report

**Date:** 2026-07-26  
**Status:** Complete  

---

## 1. Features implemented

- Withdrawal Intent (ephemeral preview + eligibility)
- Withdrawal Request (`WDR-…`) with policy/compliance/projection snapshots
- Withdrawal Policies (9 catalog policies)
- Eligibility Engine (structured checks)
- Destination Accounts (bank active; others placeholders)
- Soft Wallet Reservations (projection-aware)
- Approval Workflow (auto / manual / threshold + immutable history)
- Withdrawal Batches (`BATW-…`)
- Ledger integration on completion (`withdrawal_request` / fee templates)
- Server actions + Zod

## 2. Files created

- `features/withdrawals/services/{eligibility,withdrawal-service,withdrawal-engine.test}.ts`
- `features/withdrawals/actions/withdrawal-actions.ts`
- `constants/withdrawal-policies.ts`
- `.cursor/rules/withdrawal-ledger-principle.mdc`
- Docs: WITHDRAWAL_ENGINE, WITHDRAWAL_POLICIES, ELIGIBILITY_ENGINE, DESTINATION_ACCOUNTS, WITHDRAWAL_BATCHES, APPROVAL_WORKFLOW
- Migration `20260726020000_withdrawal_engine`
- `docs/SPRINT_11_WITHDRAWAL_REPORT.md`

## 3. Files modified

- `constants/finance-enums.ts`, `constants/public-ids.ts`
- `prisma/schema.prisma`
- `features/ledger/services/integrity.ts` — wallet on withdrawal_clearing lines
- `features/wallet/services/projection.ts` — subtract active reservations
- `docs/ROADMAP.md`
- Feature module indexes/README

## 4. Database models

WithdrawalPolicy, DestinationAccount, WithdrawalIntent, WithdrawalRequest, WithdrawalReservation, WithdrawalApproval, WithdrawalBatch

## 5. Migrations

`prisma/migrations/20260726020000_withdrawal_engine/migration.sql`

## 6. Withdrawal engine

Intent → confirm → reserve → approve/schedule → process → ledger → projection rebuild

## 7. Eligibility engine

`evaluateWithdrawalEligibility` with structured checks

## 8. Approval workflow

Immutable `WithdrawalApproval` rows; status transitions only until completion

## 9. Batch engine

`BATW-…` create/attach/process for daily/weekly policies

## 10. Ledger integration

Completion posts balanced `withdrawal_request` (+ optional fee); idempotent keys

## 11. Tests

`withdrawal-engine.test.ts` — eligibility, policies, transitions, ledger template, public IDs

## 12. Documentation

Listed in §2

## 13. Performance considerations

- Idempotency on confirm
- Reservation aggregates indexed by wallet/status
- Batch processing sequential (Phase 2)

## 14. Security considerations

- Auth required for actions
- Worker ownership on destinations/intents/cancel
- Compliance snapshot frozen at request creation
- RLS enabled (policies later)

## 15. Sprint completion %

**~96%** (no bank rails; identity verification stubbed at email level)

## 16. Production readiness

Internal withdrawal domain complete. Wire payment providers in Sprint 12; tighten KYC/AML compliance snapshots then.

## 17. Technical debt

- No actual bank transfer / provider callbacks
- Identity verification uses placeholder level
- Multi-approver steps reserved (step field only)
- Intent expiry sweeper not scheduled
- Fee calculation not productized

---

## Verification

`npm run typecheck` · `lint` · `test` · `db:validate` · `build`
