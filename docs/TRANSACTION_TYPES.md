# Transaction Types

Catalog: `constants/transaction-types.ts`  
Journal mappings: `constants/journal-templates.ts`

## Catalog

| Type | Purpose |
| --- | --- |
| campaign_funding | Allocate client funds to campaign budget |
| escrow_reserve | Lock funds for work |
| escrow_release | Pay worker (net) + platform fee |
| escrow_refund | Return escrow to client |
| escrow_partial_release | Future partial accept |
| withdrawal_request | Lock worker funds for payout |
| withdrawal_fee | Fee on withdrawal |
| withdrawal_settlement | External rail settlement |
| referral_bonus / referral_commission | Growth incentives |
| platform_fee | Standalone fee |
| adjustment | Admin correction |
| refund | Payment refund to client |
| manual_credit / manual_debit | Support ops |
| reward / bonus / promotion | Incentives |
| payment_capture / payment_failed | Provider results |
| settlement_batch | Batch header type |

## Statuses

`pending` · `processing` · `completed` · `failed` · `cancelled` · `reversed`

## Invariants

1. Every completed transaction has a posted balanced journal  
2. Idempotency key unique per type + business key  
3. Reversal creates a new transaction + reversing journal — never mutate posted lines  
