# features/api

## Bounded context
**Platform — Public API**

## Responsibility
Partner/public HTTP contract (`/api/v1`). Implementation lives in `lib/public-api/` (gateway, auth, scopes, schemas). This feature folder remains the product home for future portal UI / key management surfaces.

## Status
**Phase 4.5A complete** — see `docs/PHASE_4_5A_PUBLIC_API_PLATFORM.md`.

## Dependencies
- `lib/public-api`
- Domain application services via public catalog adapters only
- Never import repositories or internal DTOs into response shapes
