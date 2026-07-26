# Financial Architecture

> Step 6 — blueprint only. No DB · UI · payment providers · business logic.

## Mission

Every movement of value on ZOLANZO flows through a **double-entry ledger**.

```
Client Funds Wallet
  → Campaign Funding
  → Escrow Reserve
  → Ledger Entries
  → Assignment Approval
  → Escrow Release
  → Worker Wallet
  → Withdrawal
  → Settlement
```

**Never:** `Campaign → Wallet`  
**Always:** `Campaign → Escrow → Ledger → Wallet → Withdrawal`

Encoded as `FINANCIAL_PIPELINE` in `types/finance.ts`.

## Balance terminology (standard)

| Term | Meaning |
| --- | --- |
| **Balance** | Money currently available |
| **Pending Balance** | Earned but not yet released from escrow |
| **Escrow Balance** | Reserved for active work |
| **Lifetime Earnings** | Total approved earnings |
| **Lifetime Spend** | Total client spend |
| **Available for Withdrawal** | Withdrawable after holds and fees |

Source: `constants/balance-terms.ts`

## Domains

| Domain | Module | Role |
| --- | --- | --- |
| Ledger | `features/ledger` | Source of truth |
| Wallet | `features/wallet` | Balance projections |
| Escrow | `features/escrow` | Work holds |
| Payments | `features/payments` | Inbound funding |
| Withdrawals | `features/withdrawals` | Payout requests |
| Settlements | `features/settlements` | External rails / batches |
| Rewards / Referrals | `features/rewards`, `referrals` | Incentive postings |

## Core rule

Wallets are **projections** rebuildable from ledger entries.  
If wallet and ledger disagree, **ledger wins**.

## Related docs

- [LEDGER_MODEL.md](./LEDGER_MODEL.md)
- [ESCROW_MODEL.md](./ESCROW_MODEL.md)
- [WALLET_SYSTEM.md](./WALLET_SYSTEM.md)
- [TRANSACTION_TYPES.md](./TRANSACTION_TYPES.md)
- [RECONCILIATION.md](./RECONCILIATION.md)
- [FINANCIAL_REPORT.md](./FINANCIAL_REPORT.md)
