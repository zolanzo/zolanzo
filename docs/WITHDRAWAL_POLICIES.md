# Withdrawal Policies

| Key | Behavior |
| --- | --- |
| `immediate` | Auto-approve; complete via ledger when confirmed |
| `manual_approval` | Finance approval required |
| `threshold_approval` | Auto below threshold; manual above |
| `scheduled_batch` / `daily_window` / `weekly_window` | Join `BATW-…` batches |
| `minimum_balance` | Residual available required |
| `maximum_amount` | Cap per request |
| `cooling_period` | Hours between completed withdrawals |

Catalog: `constants/withdrawal-policies.ts`
