# Retry Policies

Reusable policies: `lib/reliability/retry.ts`.

## Built-ins

| Name | Strategy | Max attempts | Notes |
| --- | --- | --- | --- |
| `immediate` | immediate | 3 | No delay; dead-letter ready |
| `exponential` | exponential + jitter | 5 | General jobs |
| `finance` | exponential + jitter | 3 | Settlements / withdrawals / reconcile |
| `notifications` | exponential + jitter | 5 | Notification dispatch retries |

## API

- `resolveRetryPolicy(name | policy)`
- `computeRetryDelayMs(policy, attempt)`
- `isRetryExhausted(policy, attemptsMade)`
- `withRetry(policy, fn)` → `{ ok, value | error, attempts, deadLetterReady }`

## Rules

1. Handlers must be **idempotent** (domain services already short-circuit completed work where applicable).  
2. Exhaustion sets `deadLetterReady: true` — routing to an external DLQ is deferred (no distributed queues in 3A.2).  
3. Job executor wraps handlers with `withRetry` and logs `retryCount`.
