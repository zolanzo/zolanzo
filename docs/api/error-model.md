# Error Model

All Public API errors use one envelope. No Prisma messages, stack traces, or internal exception names are returned.

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "requestId": "req_…",
    "documentation": "/docs/api/errors",
    "details": { "retryAfterSec": 12 }
  }
}
```

## Codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Missing/invalid credentials |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `SCOPE_DENIED` | 403 | Missing required scope(s) |
| `NOT_FOUND` | 404 | Resource or route missing |
| `VALIDATION_ERROR` | 400 | Invalid / body / header invalid |
| `RATE_LIMITED` | 429 | Quota exceeded |
| `IDEMPOTENCY_CONFLICT` | 409 | Idempotency conflict |
| `CONFLICT` | 409 | State conflict (e.g. claim) |
| `FEATURE_DISABLED` | 503 | Feature flag off |
| `UNSUPPORTED_VERSION` | 400 | Unsupported API version |
| `INTERNAL_ERROR` | 500 | Unexpected failure (opaque) |

## Rate limit headers

On limited responses:

- `Retry-After`  
- `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset`  
- Daily quota headers when applicable  
