# Submission Lifecycle

```
draft → ready → submitted → validating → validation_complete
  → in_review → approved | rejected | revision_requested → closed
```

| State | Meaning |
| --- | --- |
| `draft` | Package open; evidence mutable |
| `ready` | Worker marked ready to submit |
| `submitted` | Package + manifest immutable |
| `validating` / `validation_complete` | Validation Engine (Sprint 8) |
| `in_review` / `approved` / `rejected` / `revision_requested` | Review pipeline later |
| `closed` | Terminal |

Evidence attach/replace/remove allowed only in `draft` | `ready`.

Assignment moves to `submitted` when the package is submitted.
