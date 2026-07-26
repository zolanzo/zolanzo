# Escrow Model

## Role in the pipeline

Escrow sits between campaign funding and worker payout:

```
Client wallet → Campaign funding → Escrow reserve → (work) → Escrow release → Worker wallet
```

Escrow state changes **must** post ledger journals.

## States

`reserved` · `held` · `released` · `refunded` · `expired` · `partially_released` · `split_released` (future)

## Lifecycle

```
campaign.funded / payment.succeeded
  → escrow.reserved (+ ledger escrow_reserve)
  → (optional) escrow.held during validation/review
  → review.approved → escrow.released (+ ledger escrow_release)
  → review.rejected / cancel → escrow.refunded (+ ledger escrow_refund)
  → timeout → escrow.expired (+ refund/release policy)
```

## Granularity

| Level | Use |
| --- | --- |
| Campaign escrow | Budget pool |
| Assignment escrow | Per-unit hold (preferred for 50k-scale campaigns) |

`EscrowAccountModel` supports `campaignId` + optional `assignmentId`.

## Future

- Partial release (multi-step / partial accept)
- Split release (worker + collaborator + platform)

## Coupling to Work Engine

Work-engine `EscrowHoldModel` carries `ledgerTransactionId`.  
Work engine emits domain intent; **finance posts money**.
