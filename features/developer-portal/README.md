# features/developer-portal

## Bounded context
**Platform**

## Responsibility
Keys, docs links, sandbox onboarding. UI shell for the Public API developer experience.

## Implementation
Core logic lives in `lib/developer-portal/` (Phase 4.5D):

- `DeveloperPortalService` — portal facade (Public API / OpenAPI only)
- `SDKGenerator` — TypeScript/Node from OpenAPI
- `APIExplorer` — dry-run curl + TypeScript previews
- `ExampleGenerator` / `QuickStartGenerator` / `ChangelogService`

UI: `/developer`  
Public API: `/api/v1/developer/*`

## Status
Phase 4.5D complete — see `docs/PHASE_4_5D_DEVELOPER_PORTAL.md`.
