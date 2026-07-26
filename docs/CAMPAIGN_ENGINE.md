# Campaign Engine

A **Campaign** is a business contract between a Client and ZOLANZO — not a collection of tasks.

```
Client → Campaign → Task Template → Generation Strategy → Tasks
```

Campaigns define **what** work is contracted. Generation Strategy defines **how** tasks will be created later (metadata only in Sprint 3).

## Principles

1. Campaigns consume Task Templates; they do not invent HOW work is done.
2. Campaigns do **not** generate Tasks in this sprint.
3. Every campaign has a public ID `CMP-YYYY-######`.
4. **Campaign Brief** captures human intent separately from the technical template.

## Model highlights

| Field | Role |
| --- | --- |
| `taskTemplateId` | HOW work is performed |
| `brief` | Business objective, instructions, quality examples, reviewer guidance |
| `generationStrategy` | pre_generated / on_demand / batch / streaming / api_driven |
| Quantities | target / completed / approved / rejected |
| Budgets | fixed or quantity × reward; reserved / spent / remaining |
| Scopes | country / language / device + audience constraints |
| Schedule | immediate / scheduled / recurring_future + timezone |

## Module layout

- `features/campaigns/types` — records, brief, payload
- `features/campaigns/validators` — Zod
- `features/campaigns/repositories` — Prisma access
- `features/campaigns/services` — budget, eligibility, lifecycle, publishing, scheduling, campaign-service
- `features/campaigns/actions` — server actions
- `features/campaigns/seed` — example definitions

## Related docs

- [GENERATION_STRATEGIES.md](./GENERATION_STRATEGIES.md)
- [BUDGET_ENGINE.md](./BUDGET_ENGINE.md)
- [CAMPAIGN_LIFECYCLE.md](./CAMPAIGN_LIFECYCLE.md)
- [ELIGIBILITY_RESOLUTION.md](./ELIGIBILITY_RESOLUTION.md)
