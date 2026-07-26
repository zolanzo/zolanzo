# Reconciliation & Settlement

## Goals

- Daily reconciliation of platform cash vs ledger vs provider statements  
- Settlement batches for withdrawals  
- Duplicate detection via idempotency keys  
- Failed settlement handling without silent money loss  

## Settlement batches

`SettlementBatchModel`:

- Groups withdrawals by method + currency  
- Statuses: `open` → `processing` → `settled` | `partially_failed` | `failed`  
- Events: `settlement.batch_opened` · `settlement.batch_settled` · `settlement.item_failed`

## Withdrawal rails

| Method | Status |
| --- | --- |
| Bank transfer | planned |
| Mobile money | planned |
| Manual settlement | planned |
| PayPal | future |
| Crypto | future |
| Gift cards | future |

## Reconciliation loop (design)

```
1. Export ledger balances by account/currency for the day
2. Import payment provider + bank statements
3. Match on externalRef / idempotencyKey
4. Flag unmatched / amount mismatches
5. Emit reconciliation.completed (+ exception queue)
```

## Duplicate detection

- Unique constraints on `idempotencyKey`  
- Provider webhook dedupe table (implementation later)  
- Reject second `payment.succeeded` for same providerRef  

## Failed settlements

- Mark withdrawal `failed` or `returned`  
- Reverse withdrawal_settlement journal if cash never left  
- Restore worker_liability via reversing entries  
- Notify worker + ops
