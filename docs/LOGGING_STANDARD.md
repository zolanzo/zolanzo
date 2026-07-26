# Logging Standard

Structured JSON logs only. Prefer `createLogger` / `logger` from `lib/observability/logger.ts`. Never use raw `console.log` in production paths.

## Envelope

Every line is a single JSON object written to stdout (`info`/`warn`/`debug`) or stderr (`error`/`fatal`):

```ts
{
  level: "debug" | "info" | "warn" | "error" | "fatal",
  message: string,
  ts: string,           // ISO-8601
  service: "zolanzo",
  // Auto-merged from RequestContext when present:
  correlationId?: string,
  requestId?: string,
  organizationId?: string,
  userId?: string,
  workerId?: string,
  clientId?: string,
  operation?: string,
  module?: string,
  jobName?: string,
  isRetry?: boolean,
  attempt?: number,
  // Caller fields:
  ...extra
}
```

## Levels

| Level | Use |
| --- | --- |
| `debug` | Local / verbose diagnostics (default min in non-production) |
| `info` | Successful lifecycle milestones (intent created, webhook accepted) |
| `warn` | Recoverable anomalies (degraded dependency, duplicate ignored) |
| `error` | Failed operation that needs attention |
| `fatal` | Process-threatening failures |

`LOG_LEVEL` env overrides the minimum level. Production default: `info`.

## Child loggers

```ts
const log = createLogger("payments");
// or
const log = logger.child({ module: "payments" });
```

Bindings merge under context fields; explicit call fields win last.

## Unhandled errors

```ts
import { logUnhandledError } from "@/lib/observability/logger";

logUnhandledError(err, { module: "payments", operation: "payment.webhook" });
```

Includes `err.{name,message,stack}`, `timestamp`, and active correlation fields.

## Forbidden

- Secrets, tokens, raw card PANs, full webhook bodies with PII
- Logging password / OTP / CSRF secrets
- Unstructured multi-line dumps without `correlationId` when a request context exists

## Querying incidents

Filter by `correlationId` first, then `operation` / `module` / `jobName`. See [CORRELATION_IDS.md](./CORRELATION_IDS.md).
