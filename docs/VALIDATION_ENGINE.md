# Validation Engine

Validation is a **composable pipeline** executed against immutable Submission Packages.

```
Submission (submitted)
  → Evidence Snapshot (frozen)
  → Validator Pipeline (profile-selected)
  → Validation Report (VAL-…) immutable
  → Submission (validation_complete)
```

Module: `features/verification`

Principles:

- Independent validators — never a single `validateSubmission()` blob
- Structured results (`pass` | `warning` | `fail` | `skipped`)
- Profiles select validators; validators stay reusable
- Validators read the **Evidence Snapshot**, not live mutable rows
