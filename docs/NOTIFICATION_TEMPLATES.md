# Notification Templates

Services must not build notification text inline. Everything renders from templates.

## Channels

| Channel | Body | Subject / Title |
| --- | --- | --- |
| email | text + html | subject |
| sms | text | — |
| push | text | title |
| in_app | text | title |
| webhook | JSON payload string | — |

## Variables

Templates use `{{variableName}}` placeholders. Required variables are enforced at render time.

Common variables:

- `recipientName`
- `organizationName`
- `publicRef`
- `event` (injected)

Event-specific examples: `decisionSummary`, `amountLabel`.

## Built-ins

Built-in templates live in `features/notifications/services/templates.ts` and cover every hub event × channel (email, sms, push, in_app, webhook).

Template key = event with dots → underscores (`review.approved` → `review_approved`).

## Database catalog

`NotificationTemplate` stores versioned rows for org customization later. Sprint 13 uses the code registry for rendering.
