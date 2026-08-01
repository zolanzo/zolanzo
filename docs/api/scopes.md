# Scopes

Every non-public endpoint requires one or more scopes on the calling principal.

## Catalog (v1)

| Scope | Purpose |
| --- | --- |
| `profile.read` | Current principal profile |
| `organizations.read` | List / read organizations |
| `workers.read` | List / search / read workers |
| `campaigns.read` | List / search / read campaigns |
| `campaigns.write` | Reserved for future write surface |
| `assignments.read` | List / read assignments |
| `assignments.claim` | Claim available assignments |
| `reviews.read` | Review status only |
| `payments.read` | Payment / settlement status |
| `trust.read` | Trust profile / passport (read-only) |
| `analytics.read` | Snapshots / aggregates (no raw events) |
| `forecast.read` | Advisory forecasts |
| `reports.read` | List / download reports |
| `reports.generate` | Generate reports |
| `reports.schedule` | Reserved for schedule control |
| `automation.read` | List governed rules |
| `automation.write` | Draft / submit / simulate |
| `automation.publish` | Publish approved rules |
| `webhooks.read` | List subscriptions / delivery history |
| `webhooks.write` | Create / update / delete / rotate secret |
| `webhooks.replay` | Replay deliveries |
| `integrations.read` | List connectors / health |
| `integrations.write` | Install / configure |
| `integrations.manage` | Authenticate / enable / rotate / uninstall |
| `developer.read` | Portal home, sections, examples, changelog |
| `developer.sdk` | Generate SDKs from OpenAPI |
| `developer.explorer` | API Explorer list / dry-run preview |

## Enforcement

Missing scopes return:

```json
{
  "error": {
    "code": "SCOPE_DENIED",
    "message": "Missing required scope(s): trust.read",
    "requestId": "…",
    "documentation": "/docs/api/errors",
    "details": { "missing": ["trust.read"] }
  }
}
```

## Principle

Trust, analytics, and forecasts remain **read-only** scopes. Automation **write/publish** never bypasses governance.
