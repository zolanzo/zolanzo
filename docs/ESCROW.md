# Escrow

Escrow sits between campaign funding and worker payout.

## Snapshot (`ESC-…`)

Immutable allocation captured at funding:

- Campaign revision
- Budget snapshot
- Reward snapshot
- Settlement policy snapshot

## Account lifecycle

`reserved` → `released` | `refunded`

Operations post ledger journals:

- `escrow_reserve`
- `escrow_release`
- `escrow_refund`

Module: `features/escrow`
