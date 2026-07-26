# Wallet Projection

Wallet balances are **projections**, not mutable balances.

Computed fields:

| Field | Meaning |
| --- | --- |
| `availableMinor` | From `worker_liability` ledger net |
| `pendingMinor` | Open settlements not yet completed |
| `heldMinor` | Withdrawal clearing (future) |
| `lifetimeEarnedMinor` | Cumulative escrow release credits |
| `lifetimePaidMinor` | Cumulative withdrawal debits |
| `lifetimeAdjustmentsMinor` | Manual adjustments |

No API may “add $10 to a wallet.” Credit happens only via ledger postings.

Module: `features/wallet`
