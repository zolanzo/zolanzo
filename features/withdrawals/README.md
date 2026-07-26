# features/withdrawals

## Bounded context
**Finance — Withdrawal Engine (Sprint 11)**

Intent → Eligibility → Reservation → `WDR-…` → Approval → Ledger → Batch (`BATW-…`).

**Wallets are never mutated.** Soft reservations + ledger on completion.

See [docs/WITHDRAWAL_ENGINE.md](../../docs/WITHDRAWAL_ENGINE.md).
