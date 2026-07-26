# Operational Views

Read models optimized for dashboards and workflows.

| View | Purpose |
| --- | --- |
| `platform_overview` | Cross-platform attention counts |
| `campaign_operations` | Active / paused / draft / archived |
| `marketplace_operations` | Open work, reservations, assignments |
| `review_operations` | Pending / in-review / escalated / aged |
| `settlement_operations` | Pending / processing / failed |
| `withdrawal_operations` | Approval / processing / failed |
| `notification_operations` | Scheduled / failed / delivered today |
| `payment_operations` | Awaiting / failed / succeeded today |
| `user_trust_overview` | Active / suspended / moderation proxy |
| `audit_overview` | Commands + audits today |

Views are built from `OperationalMetrics` via pure functions in `operational-views.ts`, then hydrated by `collectOperationalMetrics` (read-only Prisma counts).
