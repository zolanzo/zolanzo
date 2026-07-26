# Task Instance Lifecycle

```
generated → available ⇄ reserved → claimed → completed
                ↓           ↓          ↓
             expired / cancelled
```

| Status | Meaning |
| --- | --- |
| `generated` | Created, not released |
| `available` | Open inventory |
| `reserved` | Temporarily held (`reserved=true`) |
| `claimed` | Worker claim path (Assignment created later) |
| `expired` | Terminal |
| `cancelled` | Terminal |
| `completed` | Terminal |

Transitions: `features/tasks/services/lifecycle.ts`

Marketplace claiming and Assignments are **out of scope** for Sprint 4.
