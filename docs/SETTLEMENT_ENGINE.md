# Settlement Engine

Review Decisions become money only through Settlements.

```
Review Decision (approved)
  → Settlement Policy
  → Settlement (SET-…)
  → Escrow Release
  → Ledger Journal (TXN-…)
  → Wallet Projection rebuild
```

Settlements may join a **Settlement Batch** (`BAT-…`) for daily/weekly ops.

Module: `features/settlements`
