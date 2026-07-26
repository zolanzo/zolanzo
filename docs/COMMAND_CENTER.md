# Command Center

The Admin Console opens to a **Command Center** — a live operations dashboard, not a menu.

## Surfaces

| Signal | Source |
| --- | --- |
| Active campaigns | Campaign ops view |
| Available work | Marketplace view |
| Active assignments | Marketplace view |
| Pending reviews / settlements / withdrawals | Queue health |
| Failed notifications / payments | Queue health |
| System health | Health dashboard |
| Queue lengths + SLA | Queue health items |
| Attention list | Derived from SLA breach/watch |
| Playbook hints | Builtin playbooks |

## API

`getCommandCenter` → persists a short-lived `DashboardSnapshot` (`command_center`).

Server action: `getCommandCenterAction`.
