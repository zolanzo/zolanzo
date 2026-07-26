# Validation & Review Pipeline

Owned by `features/verification`.

## Validation (Sprint 8 ✅)

Composable pipeline — see [VALIDATION_ENGINE.md](./VALIDATION_ENGINE.md).

```
submission.submitted
  → evidence snapshot frozen
  → validators (profile-selected)
  → validation report (VAL-…)
  → submission.validation_complete
  → assignment.under_validation
```

Report statuses: `passed` · `passed_with_warnings` · `failed` · `needs_human`

## Review (next)

`pending → approved | rejected | revision_requested | escalated`

## End-to-end (future)

```
validation.completed
  ├─ passed + reviewRequired=false → treat as approved
  ├─ passed + reviewRequired=true → review.pending
  ├─ needs_human → review.pending
  └─ failed → revision_requested | rejected (policy)
→ review.approved → escrow.released → wallet.credited
```

## Separation of concerns

- **Validation** = machine-checkable quality  
- **Review** = human judgment / policy  
- **Trust** = long-term reputation  
- **Moderation** = abuse / ToS
