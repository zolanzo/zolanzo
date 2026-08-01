# Authentication

Every request to `/api/v1` resolves to a **PublicPrincipal**.

## Authentication Modes

1. **API Keys (`X-Api-Key`)**: Secrets are SHA-256 hashed at rest and scoped to explicit grant permissions.
2. **OAuth 2.1 Client Credentials (`Authorization: Bearer <access_token>`)**: Issued via `POST /api/v1/oauth/token`.
3. **Personal Access Tokens (`Authorization: Bearer zpat_...`)**: Scoped developer credentials for internal scripts and CLI automation.

## Resolution Order

1. Header `X-Api-Key`
2. Header `Authorization: Bearer <token>`
