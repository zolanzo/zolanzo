# Queue Management

Operations teams work queues, not tables.

| Queue | Items |
| --- | --- |
| `review` | ReviewQueueItem pending/in-review/escalated |
| `settlement` | Settlements pending/processing/failed |
| `withdrawal` | Withdrawal requests in flight / failed |
| `notification` | Notification jobs scheduled/queued/failed |
| `payment` | Payment intents awaiting / failed |
| `moderation` | Suspended users (proxy until cases land) |

Each queue response includes attached **playbooks**.

API: `listOperationalQueue` / `listOperationalQueueAction`.
