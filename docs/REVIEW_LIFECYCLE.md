# Review Lifecycle

```
validation_complete
  → Review Policy evaluation
  → Queue item created
       ├─ auto_approve → decision (automatic) → submission.approved
       ├─ enqueue_human → submission.in_review → claim → start → decision
       ├─ enqueue_escalated → queue.escalated
       └─ defer → queue.deferred (+ deferred decision)
```

Queue lifecycle statuses: `pending` · `assigned` · `in_review` · `decision_recorded` · `closed`

Downstream escrow/wallet/notification actions are **declared** on Review Policies but **not wired** in Sprint 9.
