# Task Template Engine

The Task Template Engine is the **work definition platform** for ZOLANZO.

> Clients do not create Tasks. They create Campaigns using Task Templates.

A template defines **how** work is performed and **who** may perform it (constraints).

```
TaskTemplate (versioned)
  ├── capabilitySet[]     what the worker does
  ├── constraints[]       eligibility conditions
  ├── requiredEvidence[]
  ├── submissionSchema
  ├── validationRules
  ├── reviewRules
  └── rewardStrategy
```

## Module layout

| Path | Role |
| --- | --- |
| `features/task-templates/` | Types, validators, repository, services, actions, seed defs |
| `constants/work-capabilities.ts` | Capability catalog |
| `constants/constraints.ts` | Constraint kinds |
| `constants/reward-strategies.ts` | Reward strategies |
| `constants/review-rules.ts` | Review actions |
| `constants/validation-rules.ts` | Validation modes/rules |
| `prisma` `TaskTemplate` | Production persistence |

## Lifecycle

`draft` → `published` (immutable) → `archived`  
Edits to published templates create a **new version** (new `TPL-…` public ID).

## Public IDs

Every template version: `generatePublicId("task_template")` → `TPL-000127`.

## Related docs

- [CAPABILITIES.md](./CAPABILITIES.md)
- [CONSTRAINTS.md](./CONSTRAINTS.md)
- [EVIDENCE_ENGINE.md](./EVIDENCE_ENGINE.md)
- [VALIDATION_RULES.md](./VALIDATION_RULES.md)
- [REWARD_STRATEGIES.md](./REWARD_STRATEGIES.md)
- [VERSIONING.md](./VERSIONING.md)
