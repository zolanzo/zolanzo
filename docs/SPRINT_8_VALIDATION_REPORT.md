# Sprint 8 — Validation Engine Report

**Date:** 2026-07-25  
**Status:** Complete  

---

## 1. Features implemented

- Composable Validation Pipeline (ordered independent validators)
- Validator interface with structured results
- Built-in validators (manifest, evidence, step_completion, timing, rule, execution_context, file_reference, gps/device placeholders)
- Immutable Validation Report (`VAL-…`)
- Validation Profiles (6 catalog profiles + DB seed)
- Validation Evidence Snapshot (frozen at pipeline start)
- Submission integration: `submitted` → `validating` → `validation_complete`
- Assignment moves `submitted` → `under_validation`
- Auto-run after `submitPackage`
- Repository · service · Zod · server actions

## 2. Files created

- `features/verification/**` (types, constants, validators, repo, services, actions, tests)
- `constants/validation-profiles.ts`
- `.cursor/rules/validation-pipeline-principle.mdc`
- Docs: VALIDATION_ENGINE, VALIDATOR_PIPELINE, VALIDATION_REPORT, VALIDATION_PROFILES, VALIDATION_EVIDENCE_SNAPSHOT
- Migration `20260725290000_validation_engine`
- `docs/SPRINT_8_VALIDATION_REPORT.md`

## 3. Files modified

- `constants/work-states.ts` — validator/report/profile enums
- `constants/public-ids.ts` — `validation_report` / `VAL-…`
- `prisma/schema.prisma` — ValidationProfile, ValidationReport, ValidationResult, ValidationEvidenceSnapshot
- `features/submissions/services/submission-service.ts` — auto-run validation after submit
- `docs/ROADMAP.md`, `docs/VALIDATION_PIPELINE.md`, `docs/VALIDATION_RULES.md`

## 4. Database models

`ValidationProfile`, `ValidationReport`, `ValidationResult`, `ValidationEvidenceSnapshot`

## 5. Migrations

`prisma/migrations/20260725290000_validation_engine/migration.sql` (includes profile seeds + RLS enable)

## 6. Validator pipeline

`runValidationPipeline` + `BUILTIN_VALIDATORS` registry; profile-driven enablement

## 7. Validation reports

Immutable `VAL-…` packages with results + evidence snapshot + profileSnapshot

## 8. Validation profiles

`app_testing` · `survey` · `ai_labeling` · `property_verification` · `voice_recording` · `translation`

## 9. Tests

`validation-engine.test.ts` — pipeline, isolation, profiles, aggregation, snapshot, public IDs

## 10. Documentation

Listed in §2

## 11. Performance considerations

- Snapshot captured once; validators share it
- Indexed submissionId/generatedAt, overallStatus, profileKey
- Pure validators suitable for future worker-queue offload

## 12. Security considerations

- Auth required for actions
- Reports immutable after create
- Evidence referenced via adapters only
- RLS enabled on new tables (policies later)

## 13. Sprint completion %

**~97%** (GPS/device geofence & fingerprint are intentional placeholders; AI validator deferred)

## 14. Production readiness

Deterministic validation path ready for Review Engine consumption. Wire queue/worker if validation latency grows.

## 15. Technical debt

- GPS/device placeholders (warnings)
- No AI validator plugin yet
- Auto-run after submit is in-process (not a durable job)
- RLS policies not authored
- `needs_human` overall status reserved but unused

---

## Verification

`npm run typecheck` · `lint` · `test` · `db:validate` · `build`
