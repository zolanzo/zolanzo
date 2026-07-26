# features/admin

## Bounded context
**Platform — Operations Console (Sprint 14)**

Admin is an **Operations Platform**. Operators work queues and Operational Views, then execute auditable **Operation Commands** (`OPC-…`). Domain tables are never queried ad hoc from console pages.

```
Command Center → Operational Views → Queues → Operation Commands → Domain Services
```

See [docs/OPERATIONS_CONSOLE.md](../../docs/OPERATIONS_CONSOLE.md).
