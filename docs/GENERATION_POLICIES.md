# Generation Policies

**Strategy** = *when* Task Instances are created.  
**Policy** = *how many* should exist.

| Policy | Behavior |
| --- | --- |
| `fixed_quantity` | Generate until total reaches N (usually `targetQuantity`) |
| `rolling_window` | Always try to keep `windowSize` available |
| `demand_buffer` | When available ≤ `refillBelow`, refill to `maintainAvailable` |
| `scheduled_batch` | Each run creates `batchSize` (up to remaining capacity) |
| `api_controlled` | Caller supplies `quantityOverride` (optional `maxPerRequest`) |

Configured on Campaign (`generationPolicy` + `generationPolicyConfig`) and **snapshotted** onto each Task Instance at generation time.

Constants: `constants/generation-policies.ts`  
Resolver: `features/tasks/services/policies.ts`
