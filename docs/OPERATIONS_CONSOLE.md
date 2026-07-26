# Operations Console

The Admin Console is an **Operations Platform**.

Operators do not browse domain tables. They consume **Operational Views**, work **queues**, and execute auditable **Operation Commands** (`OPC-…`).

```text
Command Center
    ↓
Operational Views
    ↓
Queues
    ↓
Operation Commands
    ↓
Domain Services
```

## Principles

1. Views aggregate — pages never query dozens of tables ad hoc.
2. Every mutation is an Operation Command with audit trail.
3. Commands call domain services (ledger, hub, campaigns) — they do not bypass invariants.
4. Playbooks guide procedures; they do not auto-execute in Sprint 14.

## Roles

Super Admin · Admin · Operations · Finance · Support · Moderator · Reviewer · Read-only Auditor

See [RBAC_OPERATIONS.md](./RBAC_OPERATIONS.md).

## Related

- [COMMAND_CENTER.md](./COMMAND_CENTER.md)
- [OPERATIONAL_VIEWS.md](./OPERATIONAL_VIEWS.md)
- [QUEUE_MANAGEMENT.md](./QUEUE_MANAGEMENT.md)
- [AUDIT_EXPLORER.md](./AUDIT_EXPLORER.md)
- [SPRINT_14_OPERATIONS_REPORT.md](./SPRINT_14_OPERATIONS_REPORT.md)
