# Inventory

Task Instance inventory is counted by status:

| Status | Role |
| --- | --- |
| `generated` | Minted, not yet listed |
| `available` | Marketplace-ready |
| `reserved` | Soft-hold (pre-claim) |
| `claimed` | Bound toward an Assignment (later) |
| `expired` | Past `expiresAt` / TTL |
| `cancelled` | Withdrawn |
| `completed` | Work finished |

## Analytics

- **totalGenerated** — all instances ever
- **remaining** — `targetQuantity − totalGenerated`
- **consumed** — claimed + completed
- **projected** — planning helper from current available + generated

Preview before generation also returns expected quantity, projected cost, and inventory impact.

Implementation: `features/tasks/services/inventory.ts`, `preview.ts`
