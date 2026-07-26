# Settlement Batches

Immutable operational unit (`BAT-…`) for finance.

Lifecycle: `created` → `processing` → `completed` | `failed` → `reconciled`

- Each settlement belongs to at most one batch
- Daily/weekly policies attach settlements by `periodKey`
- `processSettlementBatch` releases each eligible settlement via the ledger

Aligns with daily/weekly settlement policies and future payment-provider reconciliation.
