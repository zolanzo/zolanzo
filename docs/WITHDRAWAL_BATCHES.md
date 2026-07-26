# Withdrawal Batches

Operational unit `BATW-…` for daily/weekly payout windows.

Lifecycle: `created` → `scheduled` → `processing` → `completed` | `failed` → `reconciled`

Each `WDR-…` belongs to at most one batch. Processing completes each request via the Ledger.
