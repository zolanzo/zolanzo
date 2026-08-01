# Getting Started with ZOLANZO Public API

Make your first successful Public API request in minutes.

## 1. Obtain Credentials

You can authenticate using an API Key or OAuth 2.1 client credentials:

```bash
# Example API Key header
X-Api-Key: zk_live_...
```

Or exchange client credentials for a Bearer token:

```bash
curl -X POST https://api.zolanzo.com/api/v1/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "client_id": "zoc_demo",
    "client_secret": "zos_demo_secret",
    "scope": "campaigns.read profile.read"
  }'
```

## 2. Call your Profile Endpoint

```bash
curl -X GET https://api.zolanzo.com/api/v1/me \
  -H "Authorization: Bearer zoa_demo_token"
```

Response:

```json
{
  "data": {
    "principalId": "usr_demo",
    "type": "oauth_client",
    "scopes": ["campaigns.read", "profile.read"]
  },
  "meta": {
    "requestId": "req_123456",
    "apiVersion": "v1"
  }
}
```

## 3. List Active Campaigns

```bash
curl -X GET https://api.zolanzo.com/api/v1/campaigns?limit=10 \
  -H "Authorization: Bearer zoa_demo_token"
```
