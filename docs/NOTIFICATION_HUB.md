# Notification Hub

The Notification Hub is the **comms orchestration layer**. Domain features never send email, SMS, push, or webhooks. They emit **Notification Intents**.

```text
Domain Event
    ↓
Notification Intent (NTF-…)
    ↓
Preference Resolution
    ↓
Delivery Policy Evaluation
    ↓
Template Rendering
    ↓
Notification Jobs
    ↓
Channel Adapter
    ↓
Provider (stub / future live)
```

## Principles

1. Domain emits intents — never providers.
2. All copy comes from templates.
3. Preferences decide *whether* and *how* before jobs exist.
4. Adapters are infrastructure; only Memory delivers in Sprint 13.
5. Public ID: `NTF-…` for intents.

## Core API

| Function | Role |
| --- | --- |
| `createNotificationIntent` | Intent → jobs |
| `emitNotificationFromDomainEvent` | Domain-facing helper |
| `dispatchNotificationJob` | Adapter delivery + retry |
| `upsertNotificationPreference` | First-class preferences |

## Models

- `NotificationIntent`
- `NotificationJob`
- `NotificationTemplate`
- `NotificationPreference`
- `DeliveryPolicy`

## Related

- [NOTIFICATION_TEMPLATES.md](./NOTIFICATION_TEMPLATES.md)
- [CHANNEL_ADAPTERS.md](./CHANNEL_ADAPTERS.md)
- [DELIVERY_POLICIES.md](./DELIVERY_POLICIES.md)
- [NOTIFICATION_EVENTS.md](./NOTIFICATION_EVENTS.md)
- [SPRINT_13_NOTIFICATION_REPORT.md](./SPRINT_13_NOTIFICATION_REPORT.md)
