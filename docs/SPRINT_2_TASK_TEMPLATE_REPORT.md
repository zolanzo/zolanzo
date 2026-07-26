# Sprint 2 — Task Template Engine Report

**Date:** 2026-07-25  
**Status:** Complete  
**Score target:** Work definition platform ready for Campaign Engine  

---

## 1. Features implemented

- Production `TaskTemplate` model (versioned, public IDs)
- Capability composition engine (no hardcoded task types)
- **Constraints engine** (device / location / time / worker / organization)
- Evidence requirements + submission schema
- Validation rules (incl. `rule_based`)
- Review rules (approval, rejection, revision, escalation, sampling, multi-review-ready)
- Reward strategies (fixed, per_unit, tiered, milestone, dynamic_future)
- Draft → published (immutable) → archived + new-version flow
- In-memory registry (hydrate from DB; no switch statements)
- Typed repository, service layer, Zod validators, server actions
- Seed of 10 example templates

## 2. Files created

- `features/task-templates/**` (types, validators, repo, services, actions, seed defs, tests)
- `constants/{constraints,reward-strategies,review-rules,validation-rules}.ts`
- Docs: `TASK_TEMPLATE_ENGINE`, `CAPABILITIES`, `CONSTRAINTS`, `EVIDENCE_ENGINE`, `VALIDATION_RULES`, `REWARD_STRATEGIES`, `VERSIONING`
- Migration `20260725230000_task_templates`

## 3. Files modified

- `constants/work-capabilities.ts` — Sprint 2 capability expansions
- `constants/work-states.ts` — `rule_based` validation mode
- `prisma/schema.prisma` — `TaskTemplate` + enums
- `prisma/seed/index.ts` — seeds templates
- `docs/ROADMAP.md`

## 4. Database models

`TaskTemplate` (+ `TemplateStatus`, `TemplateVisibility`, `TemplateDifficulty`)

## 5. Migrations

`prisma/migrations/20260725230000_task_templates/migration.sql`

## 6. Seed templates

Google Play App Test · Website Signup · Image Labeling · Property Verification · Survey Completion · Voice Collection · Bug Report · Research Task · Translation Task · Custom Human Task

## 7. Capability catalog

Extended with `captures_photo`, `captures_video`, `captures_audio`, `labels_audio`, `answers_questions`, `submits_rating`, `submits_review`, `joins_group`, `follows_account`, `calls_phone`, `custom_capability` (plus prior catalog).

## 8. Validation strategies

`automatic` · `ai` · `manual` · `hybrid` · `rule_based`

## 9. Reward strategies

`fixed` · `per_unit` · `tiered` · `milestone` · `dynamic_future`

## 10. Tests added

8 new template-engine tests (31 total suite). Covers composition, evidence alignment, versioning, registry, rewards, constraints, `TPL-` public IDs.

## 11. Documentation created

Listed in §2.

## 12. Performance considerations

- JSON columns for flexible definition payloads (indexed status/category/key+version)
- Registry hydrate is explicit (`reloadTemplateRegistry`) — call after seed/boot when needed
- Sequential public IDs via `public_id_counters`

## 13. Security considerations

- Mutations require auth context
- Published templates immutable at service layer
- RLS enabled on `task_templates` (policies later)
- No campaign/task execution surface yet

## 14. Sprint completion

**100%** of Sprint 2 scope (template engine only)

## 15. Production readiness

**Ready** after `db:migrate` + `db:seed` for template definitions.  
Not ready for campaigns/marketplace (intentionally deferred).

## 16. Technical debt

- Full RLS policies not written
- Constraint **evaluation** runtime deferred to Marketplace/Assignment
- Admin studio UI not built (actions/API only)
- Legacy `constants/task-templates.ts` registry remains for architecture reference; DB + seed are source of truth going forward

---

## Verification

| Check | Result |
| --- | --- |
| Typecheck | ✅ |
| Lint | ✅ |
| Tests | ✅ (31) |
| Prisma validate | ✅ |
| Production build | ✅ |
