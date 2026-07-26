# Marketplace

Workers browse **Work Opportunities** — never raw “Task #38172” inventory lists.

Internally each opportunity is an **available** Task Instance.

```
Task Instance (available)
  → Work Opportunity
  → Eligibility
  → Claim Policy
  → Reservation
  → Assignment
```

## Guarantees

- Marketplace queries `status=available` and `reserved=false` only.
- Reserved inventory is invisible to other workers.
- Opportunity title/category come from the Campaign (business contract), not sequence numbers.

## API surface

- `browseWorkOpportunities` — search, filter, sort, cursor pagination
- `reserveWorkOpportunity` / `confirmClaim` / `claimWorkOpportunity`
- `getMarketplaceAnalytics`

Module: `features/task-marketplace`
