# Task Instance Engine

Campaigns generate **Task Instances** (`TSK-…`) — marketplace inventory — not Assignments.

```
Task Template → Campaign → Task Instance → Marketplace → Claim → Assignment
```

## Immutability

After generation, definition fields never change:

- Campaign + template version pins (`taskTemplateId`, `taskTemplateVersion`)
- Sequence number
- Generation strategy + policy snapshots
- Campaign / template public IDs

Only **lifecycle status** (and reserved flags) may change.

If a campaign or template is updated later, existing instances stay untouched; new generation uses the current versions.

## Module

- `features/tasks/services/policies.ts` — how many to create
- `features/tasks/services/inventory.ts` — counts + analytics
- `features/tasks/services/preview.ts` — dry-run cost/impact
- `features/tasks/services/task-instance-service.ts` — generate / transition
- `features/tasks/repositories` · `validators` · `actions`

## Related

- [GENERATION_POLICIES.md](./GENERATION_POLICIES.md)
- [INVENTORY.md](./INVENTORY.md)
- [TASK_LIFECYCLE.md](./TASK_LIFECYCLE.md)
- [GENERATION_STRATEGIES.md](./GENERATION_STRATEGIES.md)
