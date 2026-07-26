# Sprint 3 — Campaign Engine Report

**Date:** 2026-07-25  
**Status:** Complete  
**Score target:** Business-contract Campaign Engine ready for Task Generator  

---

## 1. Features implemented

- Production `Campaign` model with `CMP-…` public IDs
- **Campaign Brief** (business objective, success metrics, worker instructions, quality expectations, acceptable/unacceptable examples, reviewer guidance)
- Generation strategy metadata: `pre_generated` · `on_demand` · `batch` · `streaming` · `api_driven`
- Lifecycle: draft → pending_review → scheduled → active ⇄ paused → completed | cancelled → archived
- Declarative Budget Engine (fixed / quantity × reward; reserve/remaining/projected cost)
- Eligibility merge: org policies + template constraints + campaign overrides
- Scheduling: immediate / scheduled / recurring_future (declarative) + timezone
- Publishing validation, archive, duplicate, clone
- Repository · Service · Zod · Server Actions · structured errors
- Seed campaigns against seeded templates (+ seed client org)

## 2. Files created

- `features/campaigns/**` (types, validators, repo, services, actions, seed, tests)
- `constants/generation-strategies.ts`, `constants/campaign-schedule.ts`
- `.cursor/rules/campaign-principle.mdc` (prior)
- Docs: `CAMPAIGN_ENGINE`, `GENERATION_STRATEGIES`, `BUDGET_ENGINE`, `CAMPAIGN_LIFECYCLE`, `ELIGIBILITY_RESOLUTION`
- Migration `20260725240000_campaigns`
- `prisma/seed/campaigns.ts`

## 3. Files modified

- `constants/work-states.ts` — campaign lifecycle statuses
- `prisma/schema.prisma` — Campaign + enums + relations
- `prisma/seed/index.ts` — seeds campaigns
- `lib/public-id/generator.ts` — campaign on DbClient
- `docs/WORKFLOW.md`, `docs/ROADMAP.md`
- `types/work-engine.ts` — campaign conceptual note
- `features/campaigns/README.md`

## 4. Database models

`Campaign` (+ `CampaignStatus`, `CampaignVisibility`, `CampaignPriority`, `BudgetModelKind`, `GenerationStrategyKind`, `ScheduleMode`)

## 5. Migrations

`prisma/migrations/20260725240000_campaigns/migration.sql`

## 6. Seed campaigns

- Lagos Fintech App QA Wave (`pre_generated`, active)
- Retail Shelf Labeling Batch (`batch`, scheduled)
- Abuja Property Spot Checks (`on_demand`, draft)
- Nigeria Consumer Pulse Survey (`api_driven`, draft)
- Partner Portal Signup Drive (`streaming`, draft)

## 7. Lifecycle implementation

`features/campaigns/services/lifecycle.ts` + publish target selection in `publishing.ts` / `scheduling.ts`

## 8. Budget engine

`features/campaigns/services/budget-engine.ts` — no wallet wiring

## 9. Generation strategies

Metadata only — see `constants/generation-strategies.ts` and `GENERATION_STRATEGIES.md`

## 10. Tests

`features/campaigns/services/campaign-engine.test.ts` — lifecycle, budget, strategies, eligibility merge, publish validation, public IDs

## 11. Documentation

Listed in §2

## 12. Performance considerations

- Indexed status, org, client, template, category, startAt, generationStrategy
- Unique `(organizationId, slug)` and `publicId`
- JSON for brief / constraints / scopes / generation config

## 13. Security considerations

- Mutations require auth context
- Org-scoped unique slugs; FK restrict on template/client
- RLS enabled on `campaigns` (policies later)
- No task generation side effects

## 14. Sprint completion %

**~98%** of Sprint 3 scope (engine complete; UI dashboards intentionally later)

## 15. Production readiness

Core API/data layer ready for Task Generator. Wallet/escrow/marketplace not in scope.

## 16. Technical debt

- Org eligibility policies are pass-through args (not persisted on Organization yet)
- Recurring schedules are declarative only (no job runner)
- RLS policies not authored yet
- Campaign Manager UI not built

---

## Verification

Run: `npm run verify` (db:validate · typecheck · lint · test · build)
