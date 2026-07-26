# features/notifications

## Bounded context
**Comms — Notification Hub (Sprint 13)**

Domain emits **Notification Intents** (`NTF-…`). The hub creates **Notification Jobs**. Channel adapters deliver. Domain never sends email/SMS/push/webhooks.

```
Domain Event → Notification Intent → Preferences + Policy → Template → Jobs → Channel Adapter
```

See [docs/NOTIFICATION_HUB.md](../../docs/NOTIFICATION_HUB.md).
