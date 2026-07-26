# API Strategy

Public and partner APIs grow after core product loops work. REST first.

## Principles

1. **Versioned REST** — `/api/v1/...` (`API_VERSIONS`)  
2. **GraphQL later** — only if clients need flexible graphs  
3. **Idempotency** — `Idempotency-Key` on money and claim mutations  
4. **Rate limits** by scope: public, authenticated, api_key, webhook_ingress, auth, upload  
5. **Auth modes:** session cookie · bearer JWT · API key · OAuth client  

Catalog: `constants/api.ts`

## Surface map (design)

| Area | Examples |
| --- | --- |
| Auth | session, OAuth callbacks |
| Orgs | members, roles |
| Campaigns / tasks | CRUD, publish |
| Marketplace | browse, claim |
| Assignments / submissions | lifecycle |
| Wallet / escrow | balances, withdraw (server-mediated) |
| Webhooks | outbound management + inbound providers |
| Health | live / ready |

## Webhooks

- Outbound signed payloads; retry → dead letter  
- Inbound verified then enqueued (never heavy sync work)  

## Versioning

- Additive changes in `v1`  
- Breaking → `v2` with deprecation window  
- Document OpenAPI when first public routes ship  

## Security

- CSRF on cookie sessions  
- API keys hashed at rest; scoped permissions  
- Org-scoped authorization via `canInOrg()`  
- Never expose service role or ledger internals  

## Roadmap

1. Internal App Router actions + thin REST for mobile later  
2. Partner API keys for enterprise  
3. Developer portal + OpenAPI  
4. Optional GraphQL BFF  
