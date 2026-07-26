# Correlation IDs

Primary end-to-end trace key for Zolanzo requests, jobs, webhooks, and ops commands.

## Header

| Header | Purpose |
| --- | --- |
| `X-Correlation-ID` / `x-correlation-id` | Trace id across the full business flow |
| `x-request-id` | Per-hop request id (optional inbound) |

Values must be RFC4122 UUIDs. Invalid or missing inbound values are replaced with a newly generated UUID.

## Resolution rules

1. Prefer inbound `x-correlation-id` when valid.
2. Else prefer inbound `x-request-id` when valid (Headers overload only).
3. Else generate `crypto.randomUUID()`.
4. Middleware always sets both headers on the request (for Server Actions / RSC) and on the response (including redirects).

## Propagation

| Surface | Mechanism |
| --- | --- |
| Edge middleware | Resolves + stamps headers |
| Server Actions | `withServerRequestContext` reads Next `headers()` into AsyncLocalStorage |
| Services / repositories | Inherit ALS; no extra wiring when called under a wrapped action |
| Background jobs | `runJobWithContext` / `createJobContext` from `jobs/correlation.ts` |
| Job retries | Pass `originalCorrelationId` + `isRetry: true` — **do not mint a new id** |
| Payment webhooks | `runWebhookWithContext` honors inbound correlation from webhook headers |
| Ops commands | `ensureRequestContext` + enrich with actor; audit metadata includes `correlationId` |

## Logging

Every structured log line automatically includes `correlationId` (and related identities) when ALS context is active. See [LOGGING_STANDARD.md](./LOGGING_STANDARD.md).

## Client guidance

- Browsers and partner systems may send `X-Correlation-ID` to continue a prior trace.
- Always log/return the response `x-correlation-id` when opening an incident ticket.

## Code

- `lib/observability/correlation.ts`
- `lib/observability/request-context.ts`
- `middleware.ts`
- `jobs/correlation.ts`
