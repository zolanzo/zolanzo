# Generation Strategies

Generation **strategy** answers *when* Task Instances are created.  
Generation **policy** answers *how many* (see [GENERATION_POLICIES.md](./GENERATION_POLICIES.md)).

| Strategy | Intent |
| --- | --- |
| `pre_generated` | Create units up front |
| `on_demand` | Create when inventory/claim demand requires it |
| `batch` | Create on an interval (`batchSize`, `intervalMinutes`) |
| `streaming` | Continuous feed from an external source (`sourceKey`) |
| `api_driven` | External systems drive creation via API |

Configured via `generationStrategy` + optional `generationConfig` JSON on the Campaign, snapshotted onto each Task Instance.

Constants: `constants/generation-strategies.ts`
