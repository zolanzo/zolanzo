# Constraints

Constraints describe **conditions under which work is valid**.  
Capabilities describe **what** a worker does.

```
Template = Capabilities + Constraints + Evidence + Validation + Review + Reward
```

Kinds (`constants/constraints.ts`):

| Kind | Examples |
| --- | --- |
| `device` | Android 14+, iPhone only, Samsung only |
| `location` | Nigeria only, Lagos only, 2 km geofence |
| `time` | 9–5 local, 30 minutes after claim |
| `worker` | Min trust score, approval rate, language, skills |
| `organization` | Verified business, premium plan |

Each constraint: `{ id, kind, op, params, enforcement: hard|soft }`.

Campaign / Marketplace / Assignment engines will **evaluate** the same model later — templates remain the source of truth.
