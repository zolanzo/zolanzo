# Notification Events

The hub normalizes a focused set of domain events into Notification Hub events.

| Hub event | Domain event | Typical recipients |
| --- | --- | --- |
| `review.approved` | `review.approved` | worker |
| `review.rejected` | `review.rejected` | worker |
| `review.revision_requested` | `review.revision_requested` | worker |
| `settlement.completed` | `settlement.batch_settled` | worker |
| `withdrawal.approved` | `withdrawal.approved` | worker |
| `withdrawal.completed` | `withdrawal.completed` | worker |
| `campaign.funded` | `campaign.funded` | client / org members |
| `assignment.claimed` | `assignment.claimed` | client / worker |
| `submission.received` | `submission.submitted` | client / reviewer |

## Emit path

```ts
emitNotificationFromDomainEvent({
  event: "review.approved",
  recipients: [{ role: "worker", userId, email }],
  variables: { publicRef: "REV-…", organizationName: "Acme", decisionSummary: "…" },
  idempotencyKey: "review.approved:REV-…",
})
```

Domain services must not call adapters. They call the hub emit helper (or create an intent).

## Lifecycle events

Infrastructure also records:

- `notification.queued`
- `notification.sent`
- `notification.failed`

(see `constants/events.ts`)
