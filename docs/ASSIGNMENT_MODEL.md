# Assignment Model

An **Assignment** is the worker's **workspace** for one Task Instance.

Public ID: `ASN-…`

## Created by Claim Engine

Hydrates:

- Immutable **Execution Context**
- Ordered **Execution Steps** (from template capabilities)
- Checklist rows (`AssignmentStep`)
- Timeline `claimed` event

## Workspace lifecycle

```
assigned → started → in_progress ⇄ paused → ready_for_submission → submitted
  → under_validation → under_review → …
  → expired | cancelled | completed
```

(`claimed` kept as legacy alias of `assigned`)

## Related docs

- [ASSIGNMENT_WORKSPACE.md](./ASSIGNMENT_WORKSPACE.md)
- [EXECUTION_ENGINE.md](./EXECUTION_ENGINE.md)
- [CHECKLIST_ENGINE.md](./CHECKLIST_ENGINE.md)
- [PROGRESS_ENGINE.md](./PROGRESS_ENGINE.md)
- [TIMELINE.md](./TIMELINE.md)
