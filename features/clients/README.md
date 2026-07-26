# features/clients

## Bounded context
**Demand (Client)**

## Responsibility
Client profiles for anyone who posts work: individuals, companies, agencies, startups, enterprises, government, NGOs, universities.

User-facing language is **Client**, not Advertiser.

## Structure
- `components/` — Feature-specific UI only (compose design system)
- `hooks/` · `services/` · `repositories/` · `types/` · `constants/` · `validators/`

## Models
See `types/identity.ts` → `ClientProfileModel` and `constants/client-kinds.ts`.

## Compatibility
`features/advertisers` is a deprecated alias that re-exports this module’s public surface once implemented.

## Status
Architecture scaffold only — **no business logic** in Step 4.
