# Ledger

The Ledger is the **only financial source of truth**.

## Rules

1. Every movement is a balanced journal (Σ debits == Σ credits).
2. Journals are immutable; corrections are reversing journals.
3. Transactions use public IDs `TXN-…` with `idempotencyKey`.
4. Templates live in `constants/journal-templates.ts`.

## Integrity

`assertBalancedJournal` rejects unbalanced or zero totals before persistence.

Module: `features/ledger`
