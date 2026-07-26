# Ledger Model

## Double-entry

Every financial event creates a **Journal** with balanced **Entries**:

```
Σ debits (minor) == Σ credits (minor)
```

Statuses: `pending` · `completed` · `failed` · `reversed` · `expired`

## Entities

| Entity | Purpose |
| --- | --- |
| LedgerAccount | Chart of accounts code + currency |
| LedgerJournal | Immutable header (idempotency key, type, memo) |
| LedgerEntry | Debit or credit line |
| FinancialTransaction | Business transaction wrapping a journal |

Models: `types/finance.ts`  
Accounts: `constants/ledger.ts`  
Posting templates: `constants/journal-templates.ts`

## Immutability

- Journals are **never deleted**
- Corrections = new reversing journal (`ledger.journal.reversed`)
- Append-only `FinancialAuditModel`

## Idempotency

Every transaction/journal carries `idempotencyKey` (provider ref, assignment id + type, etc.) to prevent duplicate money movement.

## Example: Escrow release to worker

On `review.approved`:

1. `transaction.created` type `escrow_release`  
2. Journal lines (template):
   - Debit `escrow_liability` (amount)
   - Credit `worker_liability` (net)
   - Credit `platform_fee_revenue` (fee)
3. `ledger.journal.posted` · `ledger.entry.created` × N  
4. Update wallet projections → `wallet.credited`  
5. Escrow status → released · `escrow.released`

## Chart of accounts (logical)

Cash clearing · Client/Org funds & liabilities · Worker payable/liability · Escrow asset/liability · Withdrawal clearing · Platform revenue · Refunds · Adjustments · Rewards expense · FX clearing (future)
