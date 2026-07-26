# Withdrawal Engine

Workers cash out through a validated path that **never mutates wallet balances**.

```
Wallet Projection
  → Withdrawal Intent (ephemeral)
  → Eligibility + Policy
  → Reservation (soft hold)
  → Withdrawal Request (WDR-…)
  → Approval (status only)
  → Ledger on completion
  → Batch (BATW-…) optional
  → Provider (future)
```

Module: `features/withdrawals`
