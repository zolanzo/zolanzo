# Sprint 7 — Submission Package & Evidence Engine Report

**Date:** 2026-07-25  
**Status:** Complete  

---

## 1. Features implemented

- Submission Package model (`SUB-…`) with execution context snapshot
- Evidence Manifest + Evidence Items (typed kinds)
- Evidence Engine: attach / replace / remove (pre-submit) / finalize
- Immutability after submit
- Submission lifecycle (draft → ready → submitted → … → closed)
- Auto Submission Summary
- Assignment integration (`→ submitted` + timeline)
- Evidence Storage Adapters (memory default; ports for supabase/s3/r2/gcs/azure)
- Repository · service · Zod · server actions

## 2. Files created

- `features/submissions/**` (types, validators, repo, services, actions, tests)
- `lib/integrations/evidence/**`
- Docs: SUBMISSION_ENGINE, EVIDENCE_MANIFEST, SUBMISSION_LIFECYCLE, SUBMISSION_SUMMARY, EVIDENCE_ADAPTERS
- Migration `20260725280000_submission_packages`
- `.cursor/rules/submission-package-principle.mdc`
- `docs/SPRINT_7_SUBMISSION_REPORT.md`

## 3. Files modified

- `constants/work-states.ts` — submission statuses + transitions + manifest kinds
- `lib/integrations/types.ts` · `registry.ts` — evidence storage port
- `prisma/schema.prisma` — Submission, EvidenceManifest, EvidenceItem, SubmissionSummary
- `features/assignments/services/workspace-service.ts` — evidence placeholder copy
- `docs/ROADMAP.md`

## 4. Database models

`Submission`, `EvidenceManifest`, `EvidenceItem`, `SubmissionSummary` (+ `ManifestEvidenceKind`)

## 5. Migrations

`prisma/migrations/20260725280000_submission_packages/migration.sql`

## 6. Evidence engine

Attach/replace/remove via adapter references; hash + size; inline kinds for text/json/gps/link

## 7. Submission lifecycle

`lifecycle.ts` + service transitions; immutable after `submitted`

## 8. Summary generation

`generateSubmissionSummary` at submit time

## 9. Tests

`submission-engine.test.ts` — lifecycle, mutability, adapter refs, summary, hashing, public IDs

## 10. Documentation

Listed in §2

## 11. Performance considerations

- Indexed assignment/status/submittedAt
- Manifest items ordered by createdAt
- Adapter I/O isolated from package metadata writes

## 12. Security considerations

- Auth required for mutations
- Worker ownership checks on create/submit
- Evidence mutable only pre-submit
- RLS enabled on new tables (policies later)
- No vendor credentials in Submission module

## 13. Sprint completion %

**~97%** (cloud adapters stubbed behind ports; no binary upload HTTP routes yet)

## 14. Production readiness

Package/manifest data layer ready for Validation/Review. Wire real storage adapter before production media.

## 15. Technical debt

- Memory adapter only by default
- Base64 attach API (prefer signed upload URLs next)
- Revision flow creates new draft packages — UX not built
- Validation states reserved but unused until Sprint 8

---

## Verification

`npm run verify`
