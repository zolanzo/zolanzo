# Checklist Engine

Each execution step has checklist status:

| Status | Meaning |
| --- | --- |
| `pending` | Not started |
| `in_progress` | Worker is on this step |
| `completed` | Done |
| `skipped` | Optional step skipped |
| `failed` | Worker marked failure |

Rules:

- Required steps cannot be skipped
- Dependencies must be completed/skipped before starting/completing
- Step transitions emit timeline events

Implementation: `features/assignments/services/checklist-engine.ts`
