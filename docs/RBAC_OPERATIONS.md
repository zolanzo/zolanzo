# RBAC — Operations

## Roles

| Role | Label | Notes |
| --- | --- | --- |
| `super_admin` | Super Admin | `*` |
| `admin` | Admin | Full ops + finance + moderation |
| `operations` | Operations | Queues + commands (non-finance) |
| `finance` | Finance | Withdrawal / settlement / payment commands |
| `support` | Support | Read command center + audit |
| `moderator` | Moderator | Moderation queue + act |
| `reviewer` | Reviewer | Review queue manage |
| `auditor` | Read-only Auditor | Views + audit + health; **no commands** |

## Permissions

- `ops.command_center.read`
- `ops.views.read`
- `ops.commands.execute`
- `ops.queues.manage`
- `ops.audit.read`
- `ops.health.read`
- `ops.playbooks.read`
- `ops.finance.act`
- `ops.moderation.act`

Finance queues require `ops.finance.act` (or admin). Moderation requires `ops.moderation.act` (or admin).
