# Sprint 4 — Task Instance Generator Report

**Date:** 2026-07-25  
**Status:** Complete  
**Score target:** Immutable marketplace inventory ready for Marketplace / Assignments  

---

## 1. Features implemented

- Production `TaskInstance` model with `TSK-…` public IDs
- Generation strategies wired into generator runs
- Generation policies: fixed · rolling window · demand buffer · scheduled batch · API controlled
- Inventory counts + analytics (remaining / consumed / projected)
- Generation preview (quantity, cost, inventory impact)
- Lifecycle transitions (no marketplace claim yet)
- Immutability: definition fields frozen after insert; template version pinned
- Campaign `generationPolicy` + config
- Repository · service · Zod · server actions · seed inventory

## 2. Files created

- `features/tasks/**` (types, validators, repo, services, actions, tests)
- `constants/generation-policies.ts`
- `.cursor/rules/task-instance-principle.mdc`
- Docs: `TASK_INSTANCE_ENGINE`, `GENERATION_POLICIES`, `INVENTORY`, `TASK_LIFECYCLE`
- Migration `20260725250000_task_instances`
- `prisma/seed/task-instances.ts`
- `docs/SPRINT_4_TASK_INSTANCE_REPORT.md`

## 3. Files modified

- `prisma/schema.prisma` — TaskInstance + GenerationPolicyKind + Campaign policy fields
- `constants/work-states.ts` — Task Instance lifecycle statuses
- `features/campaigns/**` — policy fields through types/validators/repo/service/seed
- `prisma/seed/{index,campaigns}.ts`
- `docs/{ROADMAP,WORKFLOW,GENERATION_STRATEGIES}.md`
- `types/work-engine.ts`
- `.cursor/rules/campaign-principle.mdc`

## 4. Database models

`TaskInstance` (+ `TaskInstanceStatus`, `TaskInstancePriority`, `GenerationPolicyKind`)

## 5. Migrations

`prisma/migrations/20260725250000_task_instances/migration.sql`

## 6. Seed inventory

From seeded active/scheduled campaigns (capped for local):

- Lagos Fintech App QA → 10 available
- Retail Shelf Labeling → 5 available

## 7. Generation engine

`resolveGenerationQuantity` + `generateTaskInstances` + preview

## 8. Inventory engine

`countByStatus` · `buildInventoryAnalytics` · `projectInventoryAfterGeneration`

## 9. Tests

`features/tasks/services/task-instance-engine.test.ts` — policies, strategies, lifecycle, inventory, preview, public IDs

## 10. Documentation

Listed in §2

## 11. Performance considerations

- `createMany` for bulk inserts
- Indexes on `(campaignId, status)`, status, expiresAt, strategy/policy
- Unique `(campaignId, sequenceNumber)`
- Seed caps quantities; production runs should batch public-ID allocation

## 12. Security considerations

- Mutations require auth context
- Generation only for scheduled/active/paused campaigns
- Template must be published; version pinned on instance
- RLS enabled on `task_instances` (policies later)
- No claim/assignment side effects

## 13. Sprint completion %

**~98%** of Sprint 4 scope (engine complete; job runners for scheduled/streaming later)

## 14. Production readiness

Core inventory layer ready for Marketplace. Claiming / Assignments intentionally deferred.

## 15. Technical debt

- Bulk `generatePublicId` is sequential (optimize with batch allocator later)
- Scheduled/streaming strategies are declarative — no cron worker yet
- On-demand refill not hooked to claim events (no claims yet)
- RLS policies not authored
- Campaign version number not separate from template version (campaign mutations don't version rows yet)

---

## Verification

Run: `npm run verify` (db:validate · typecheck · lint · test · build)
