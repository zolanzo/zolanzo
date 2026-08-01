# API Versioning

ZOLANZO public APIs are versioned in the URL path.

## Current

| Version | Status | Base path |
| --- | --- | --- |
| `v1` | Supported | `/api/v1/` |

No other versions are served.

## Compatibility promise

- **Additive** changes may ship in `v1` (new optional fields, new endpoints, new scopes).  
- **Breaking** changes require a new major version (`v2`) with a documented deprecation window.  
- Internal modules may change freely; public schemas do not.

## Response metadata

Every successful response includes:

```json
{
  "meta": {
    "requestId": "req_…",
    "apiVersion": "v1"
  }
}
```

## Headers

| Header | Meaning |
| --- | --- |
| `X-Api-Version` | Always `v1` for this surface |
| `X-Request-Id` | Correlation id for support / audit |

## Deprecation policy (future)

When `v2` ships:

1. Announce deprecation of `v1` endpoints being replaced  
2. Keep `v1` available for a minimum window  
3. Document migration in the changelog and developer portal (4.5D)
