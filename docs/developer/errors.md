# Error Handling

All Public API errors use a single, predictable public JSON envelope.

## Error Response Envelope

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "requestId": "req_12345",
    "documentation": "/docs/api/errors",
    "details": {
      "retryAfterSec": 12
    }
  }
}
```

## Standard Error Codes

- `UNAUTHORIZED` (401): Missing or invalid credentials
- `FORBIDDEN` (403): Principal lacks permission
- `SCOPE_DENIED` (403): Missing required scope
- `NOT_FOUND` (404): Resource missing
- `VALIDATION_ERROR` (400): Invalid request parameters or body
- `RATE_LIMITED` (429): Quota exceeded
- `IDEMPOTENCY_CONFLICT` (409): Duplicate mutation in progress
- `INTERNAL_ERROR` (500): Unexpected failure (sanitized; no stack traces)
