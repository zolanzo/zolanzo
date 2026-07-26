# Wallet System

## Hierarchy

| Kind | Owner | Typical use |
| --- | --- | --- |
| Worker | User | Earnings & withdrawals |
| Client | User | Individual client funding |
| Organization | Org | Shared client funding & spend |
| Platform | System | Fees & revenue |
| Referral | User/system | Referral commissions |
| Partner | Future | Partner revenue share |
| Marketplace | Future | Marketplace float |

Kinds: `constants/wallet-kinds.ts`

## Projections (not source of truth)

Each wallet exposes a `WalletBalanceView`:

| Field | Term |
| --- | --- |
| `balanceMinor` | Balance |
| `pendingBalanceMinor` | Pending Balance |
| `escrowBalanceMinor` | Escrow Balance |
| `lifetimeEarningsMinor` | Lifetime Earnings |
| `lifetimeSpendMinor` | Lifetime Spend |
| `availableForWithdrawalMinor` | Available for Withdrawal |

Rebuild algorithm (implementation later): sum completed ledger entries for wallet accounts, apply holds/fees.

## Statuses

`active` · `frozen` · `closed`

Frozen wallets block withdrawals and spend (disputes, fraud).

## Events

`wallet.created` · `wallet.credited` · `wallet.debited` · `wallet.frozen` · `wallet.released`
