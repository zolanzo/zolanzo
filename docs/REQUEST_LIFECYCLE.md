# Request Lifecycle

How a unit of work enters Zolanzo and carries observability context from edge to ledger.

## Happy path (HTTP / Server Action)

```
Client
  │  (optional X-Correlation-ID)
  ▼
Edge middleware
  │  resolve / generate correlationId + requestId
  │  stamp request + response headers
  │  security / CSRF / auth gate
  ▼
Server Action or Route Handler
  │  withServerRequestContext / ensureRequestContext
  │  enrich userId, organizationId, operation
  ▼
Feature service → repository → Prisma / adapters
  │  logs inherit ALS fields
  ▼
Response
  │  x-correlation-id, x-request-id
  ▼
Client / operator
```

## Payment webhook path

```
Provider webhook
  │  headers + body
  ▼
handlePaymentWebhook
  │  readCorrelationHeader(headers)
  │  runWebhookWithContext({ provider, correlationId })
  ▼
Adapter parseWebhook → payment events
  ▼
Ledger / domain side effects (unchanged business logic)
  ▼
Structured logs (same correlationId)
```

## Background job path

```
Scheduler / worker
  │  createJobContext({ jobName, correlationId? })
  │  on retry: originalCorrelationId + isRetry
  ▼
runJobWithContext → job handler
  ▼
Services / ledger / notifications
  ▼
Logs + ops audit
```

## Ops command path

```
Admin UI / API
  │  executeOperationCommandAction
  │  withServerRequestContext({ operation: "ops.command" })
  ▼
executeOperationCommand
  │  ensureRequestContext + enrich actor
  │  audit row metadata.correlationId
  ▼
Domain effect (or accepted stub)
```

## Identities on the context

Optional fields enriched as soon as known:

- `organizationId`
- `userId`
- `workerId`
- `clientId`
- `operation`
- `module`
- `jobName` / `isRetry` / `attempt`

## Error envelope

Unhandled errors should be logged via `logUnhandledError`, which attaches active context (`correlationId`, `operation`, `module`) plus stack and timestamp.

## Health

`/health` and readiness payloads include process meta: `buildVersion`, `gitCommit`, `startupTime`, `uptimeSeconds`. These are independent of correlation but help tie incidents to a deploy.

## Related

- [CORRELATION_IDS.md](./CORRELATION_IDS.md)
- [LOGGING_STANDARD.md](./LOGGING_STANDARD.md)
- [OBSERVABILITY.md](./OBSERVABILITY.md)
