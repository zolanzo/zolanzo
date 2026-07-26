# Settlement Policies

Separate from Review Policies.

| Key | Behavior |
| --- | --- |
| `immediate` | Process ledger release on approval |
| `hold_period` | Schedule for N days (default 7) |
| `campaign_completion` | Wait until campaign closes |
| `daily_batch` | Attach to daily `BAT-…` |
| `weekly_batch` | Attach to weekly `BAT-…` |
| `manual_finance_approval` | Remain pending until finance processes |

Catalog: `constants/settlement-policies.ts`  
DB seed: `settlement_policies`
