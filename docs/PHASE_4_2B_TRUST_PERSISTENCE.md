# Phase 4.2B — Trust Persistence & Event Integration

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.2A Trust Foundation](./PHASE_4_2A_TRUST_FOUNDATION.md)

## Mission

Make Trust a **persistent, event-driven** platform capability.

- Domains publish trust events; Trust Engine owns calculation + persistence
- No other module invents trust math
- Match Engine / Copilots **consume** `TrustProfileService`

## Architecture

```text
Domain Events (claim / review / settlement / …)
        ↓
safeRecordTrustEvent (never fails domain)
        ↓
TrustEvent (append-only, idempotent)
        ↓
TrustCalculator + decay
        ↓
TrustProfile + TrustScoreHistory
        ↓
Match / Worker Copilot / Org Copilot / Admin
```

## Schema

### `trust_profiles`

| Column | Notes |
| --- | --- |
| `subject_type` | `worker` \| `organization` \| `reviewer` |
| `subject_id` | Subject key (usually user id) |
| Dimension scores | identity…reputation |
| `overall_score`, `trend`, `reasons`, `warnings` | Explainable output |
| `last_influencing_events` | Recent weighted events |
| `version`, `model_version`, `last_calculated_at` | Versioning |

Public ID: `TRS-…`

### `trust_events` (append-only)

| Column | Notes |
| --- | --- |
| `idempotency_key` | Unique — duplicates skipped |
| `correlation_id` / `causation_id` | Traceability |
| `sequence` | Per-subject ordering |
| `status` | `pending` \| `processed` \| `failed` \| `dead_letter` |
| `attempt_count` / `next_retry_at` | Retry + DLQ |
| `processor_version` | Engine version at process time |

Public ID: `TRE-…`

### `trust_score_history`

Point-in-time dimension snapshots for trends & audits.

## Migration

- SQL: `prisma/migrations/20260726140000_trust_persistence/migration.sql`
- Bootstrap existing workers: `bootstrapTrustProfiles()` in `lib/trust/bootstrap.ts`
- Apply with your usual Prisma / Supabase migrate path against the **Zolanzo** database (FK to `users` required)

## Event sources wired

| Domain | Event | Hook |
| --- | --- | --- |
| Marketplace claim | `assignment_accepted` | `claim-engine.ts` |
| Review decision | `submission_approved` / `rejected` / `revision_requested` + `review_completed` | `review-service.ts` |
| Settlement release | `payment_settled` | `settlement-service.ts` |

Emit path: `safeRecordTrustEvent` — logs failures, never throws into business flows.

Ready for additional emitters (identity verify, fraud confirmed/cleared, suspension/reinstatement, endorsements) via the same API.

## Event processing guarantees

| Concern | Implementation |
| --- | --- |
| Idempotency | Unique `idempotency_key` |
| Ordering | `occurred_at` + `sequence`; replay sorts ascending |
| Replay | `replayPendingEvents()` |
| Versioning | `processor_version` / `model_version` (`trust-engine/1.1.0`) |
| Retry | Exponential-ish backoff via `next_retry_at` |
| DLQ | `status = dead_letter` after `max_attempts` |
| Correlation | `correlation_id` / `causation_id` columns |

## Recalculation APIs

```ts
import { TrustProfileService } from "@/lib/trust/trust-service";

await TrustProfileService.resolveProfile({ subjectType: "worker", subjectId });
await TrustProfileService.resolveScore({ subjectType: "worker", subjectId });
await TrustProfileService.recalculate({ subjectType: "worker", subjectId });
await TrustProfileService.recordEvent({ … });
await TrustProfileService.history({ subjectType: "worker", subjectId });
await TrustProfileService.batchRecalculate({ limit: 200 });
await TrustProfileService.nightlyReconciliation();
```

## Consumers

- **Match Engine** — `resolveScoresBatch` (persisted scores first; calculator fallback)
- **Worker Copilot** — persisted profile + reasons / last events for “how can I improve trust?”
- **Org Copilot** — intents: highest trust, declining, recently improved, strongest reliability

## Admin

Trust Health now includes: profiles · events/hr · DLQ · failed · distribution · rising/falling · latency

## Replay strategy

1. Select `pending` / `failed` (optional `dead_letter`) due for retry  
2. Order by `occurred_at ASC`, `sequence ASC`  
3. Recalculate profile from domain signals + all events  
4. Mark processed or bump attempt → DLQ  

Nightly: `nightlyReconciliation()` = replay + batch recalculate.

## Performance

- Event write: single insert + profile upsert + history row  
- Match pool: one batch `findMany` for trust scores (no N+1)  
- Caps: 200 events/subject load, 5000 profiles for admin distribution sample  

## Compatibility

- 4.2A calculator / decay / explainability unchanged  
- In-memory profile helpers remain for unit tests  
- `resolveOverallTrustScore` remains fallback when no persisted row  

## Known limitations

- Not every domain event is wired yet (identity KYC, fraud confirm, endorsements, suspend/reinstate)  
- Organization / reviewer subject types supported in schema; bootstrap focuses on workers  
- Nightly job is callable API — not yet on a scheduler  
- RLS policies for trust tables not added in this slice  

## Tests

`lib/trust/trust-persistence.test.ts` + `trust-engine.test.ts`

Versioning · weights · decay ordering · DLQ telemetry · profile persistence shape · flags · replay ordering contract

## Next

**4.2C — Trust Passport** ✅ See [PHASE_4_2C_TRUST_PASSPORT.md](./PHASE_4_2C_TRUST_PASSPORT.md).

Recommended next: **Phase 4.3 — Business Intelligence**.

## Implementation Report

1. **Features:** Persistent TrustProfile/Event/History; idempotent event processing; domain wiring; consumer updates; admin DLQ metrics; bootstrap  
2. **Created:** migration, `trust-profile-service.ts`, `safe-emit.ts`, `bootstrap.ts`, `mappers.ts`, `trust-persistence.test.ts`, this doc  
3. **Modified:** claim/review/settlement services, Match + Worker/Org copilots, admin Trust Health, public IDs, ROADMAP  
4. **Database:** `trust_profiles`, `trust_events`, `trust_score_history`  
5. **Routes:** none  
6. **Env:** same as 4.2A (`TRUST_*`)  
7. **Security:** trust emits isolated; no domain mutation from trust layer  
8. **Performance:** batch score reads; capped event history  
9. **Tests:** persistence suite (9) + existing trust/copilot suites green  
10. **TODOs:** scheduler for nightly; remaining event emitters; RLS  
11. **Production readiness:** persistence + wired core events ready; bootstrap before relying on scores in prod  
