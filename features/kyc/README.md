# features/kyc

## Bounded context
**Trust** — Passport consumer, not a local verification engine.

## Responsibility
Orchestrate identity-verification **gates and UX** in ZOLANZO by calling `IdentityVerificationProvider` (default: Stankings Passport). Store mirrored status for local policy checks; never implement document KYC inside this module.

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
- Domain: `@/types/domain`, `@/constants/events`, `@/constants/permissions`
- Infra: `@/lib/integrations` (`IdentityVerificationProvider`), `@/lib/events`, `@/lib/rbac`

## Events
`kyc.submitted` · `kyc.approved` · `kyc.rejected` · `identity.verified` — typically emitted after Passport webhooks, not from a local reviewer workflow (unless ops override).

## Status
Architecture scaffold only — **no business logic** until Phase 2 / trust gates.
