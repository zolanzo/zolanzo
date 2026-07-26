# Review Queue

Queue item statuses:

| Status | Meaning |
| --- | --- |
| `pending` | Awaiting claim |
| `assigned` | Reviewer claimed |
| `in_review` | Actively reviewing |
| `completed` | Decision recorded |
| `escalated` | Escalation path |
| `deferred` | Waiting (e.g. customer review) |

Lifecycle: `pending → assigned → in_review → decision_recorded → closed`

Table: `review_queue_items` · Assignments: `review_assignments`
