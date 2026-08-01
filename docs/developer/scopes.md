# Scopes & Authorization

All Public API endpoints enforce explicit permission scopes.

## Scope Catalog

| Scope | Description |
| --- | --- |
| `profile.read` | View calling principal profile (`/me`) |
| `organizations.read` | Read organization details |
| `workers.read` | Read & search worker profiles |
| `campaigns.read` | Read & search campaign details |
| `assignments.read` | Read assignment status |
| `assignments.claim` | Claim available work assignments |
| `reviews.read` | Read review decision status |
| `payments.read` | Read payment & settlement status |
| `trust.read` | Read Trust profiles, passports, & badges |
| `analytics.read` | Read analytics snapshots & aggregates |
| `forecast.read` | Read advisory forecasts |
| `reports.read` | List & download generated reports |
| `reports.generate` | Trigger report generation |
| `automation.read` | Read governed rules |
| `automation.write` | Create rule drafts & simulations |
| `automation.publish` | Publish approved rules |
| `webhooks.read` | Read webhook subscriptions & delivery logs |
| `webhooks.write` | Create, update, & rotate webhook secrets |
| `webhooks.replay` | Replay webhook deliveries |
| `integrations.read` | View marketplace connectors & health |
| `integrations.write` | Install & configure connectors |
| `integrations.manage` | Authenticate, enable, & uninstall connectors |
| `developer.read` | Read developer portal sections & examples |
| `developer.sdk` | Generate client SDKs |
| `developer.explorer` | Access API Explorer |
