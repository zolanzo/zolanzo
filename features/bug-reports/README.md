# features/bug-reports

## Bounded context
**QA**

## Responsibility
Bug hunting submissions and triage.

## Structure
- `components/` — Feature-specific UI only (compose `components/ui` + layouts; never duplicate primitives)
- `hooks/` — Feature React hooks
- `services/` — Use-cases / orchestration (extends `services/base`)
- `repositories/` — Persistence adapters (extends `repositories/base`)
- `types/` — Feature types (import shared IDs from `@/types/domain`)
- `constants/` — Feature constants
- `validators/` — Zod schemas for this feature

## Dependencies
- Design system: `@/components/ui`, `@/components/layout`, `@/components/templates`
- Domain: `@/types/domain`, `@/constants/campaign-types`, `@/constants/events`, `@/constants/permissions`
- Infra: `@/lib/events`, `@/lib/rbac`, `@/lib/feature-flags`

## Events
See `docs/EVENTS.md` and `constants/events.ts`. Bind concrete publishers/subscribers when implementing.

## Status
Architecture scaffold only — **no business logic** in Step 3.
