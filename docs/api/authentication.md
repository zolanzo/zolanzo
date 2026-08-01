# Authentication

The Public API authenticates every request to a **principal**. Session cookies are not the primary partner auth mode.

## Modes

### 1. API Keys

```http
X-Api-Key: zk_live_…
```

- Secrets are hashed at rest (SHA-256)  
- Keys carry an explicit scope set  
- Keys may be org-scoped  

### 2. OAuth 2.1 (foundation)

Client credentials grant:

```http
POST /api/v1/oauth/token
Content-Type: application/json
Idempotency-Key: …

{
  "grant_type": "client_credentials",
  "client_id": "zoc_…",
  "client_secret": "zos_…",
  "scope": "campaigns.read trust.read"
}
```

Response:

```json
{
  "data": {
    "access_token": "zoa_…",
    "token_type": "Bearer",
    "expires_in": 3600
  },
  "meta": { "requestId": "…", "apiVersion": "v1" }
}
```

Use:

```http
Authorization: Bearer zoa_…
```

### 3. Personal Access Tokens (optional)

```http
Authorization: Bearer zpat_…
```

Intended for internal / developer tooling. Same scope model as API keys.

## Resolution order

1. `X-Api-Key`  
2. `Authorization: Bearer` (OAuth access token, then PAT)

Missing or invalid credentials → `401 UNAUTHORIZED`.
