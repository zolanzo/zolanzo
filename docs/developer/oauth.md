# OAuth 2.1 Client Credentials

ZOLANZO implements the OAuth 2.1 client credentials grant for server-to-server integration.

## Requesting a Token

```http
POST /api/v1/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "zoc_123456",
  "client_secret": "zos_abcdef",
  "scope": "campaigns.read trust.read"
}
```

## Token Response

```json
{
  "access_token": "zoa_789xyz...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```
