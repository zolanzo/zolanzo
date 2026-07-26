# Campaign Lifecycle

```
draft → pending_review → scheduled ⇄ active ⇄ paused → completed | cancelled → archived
```

Also allowed: draft → scheduled | active | cancelled | archived (direct publish paths).

| Status | Meaning |
| --- | --- |
| `draft` | Editable contract |
| `pending_review` | Awaiting internal review |
| `scheduled` | Published; waiting for start |
| `active` | Live contract (tasks still not generated here) |
| `paused` | Temporarily halted |
| `completed` | Success criteria met / quantity done |
| `cancelled` | Stopped early |
| `archived` | Terminal retention state |

Publish validation chooses `scheduled` vs `active` from schedule mode + `startAt`.

Transitions: `features/campaigns/services/lifecycle.ts`
