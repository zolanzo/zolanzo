# Phase 4.2A — Trust & Reputation Foundation

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.1F Worker Copilot](./PHASE_4_1F_WORKER_COPILOT.md)

## Mission

Make **trust a platform-wide primitive** — explainable, time-decayed, and owned by a single engine.

- Never bypasses domain services for business mutations
- Never writes wallets, reviews, assignments, or settlements
- Match Engine / Worker Copilot consume the shared score via `resolveOverallTrustScore`
- Event updates flow through `TrustProfileService` / `processTrustDomainEvent`

## Architecture

```text
Domain signals / Trust events
        ↓
TrustSignalSnapshot (frozen)
        ↓
TrustCalculator (6 dimensions + overall)
        ↓
TrustTrendAnalyzer
        ↓
TrustExplanationBuilder
        ↓
TrustProfile (advisory output)
```

Package: **`lib/trust/`** (platform capability — not under `lib/ai/`).

| Component | Path |
| --- | --- |
| TrustCalculator | `lib/trust/calculator.ts` |
| TrustTrendAnalyzer | `lib/trust/trend-analyzer.ts` |
| TrustExplanationBuilder | `lib/trust/explanation-builder.ts` |
| TrustEventProcessor | `lib/trust/event-processor.ts` |
| TrustEngine | `lib/trust/trust-engine.ts` |
| TrustProfileService | `lib/trust/profile-service.ts` |
| TrustProfileLoader | `lib/trust/profile-loader.ts` (read-only Prisma) |
| TrustService (server) | `lib/trust/trust-service.ts` |
| Time decay | `lib/trust/time-decay.ts` |

## Dimensions

| Dimension | Weight | Signals (examples) |
| --- | --- | --- |
| Identity | 20% | Email, phone, gov ID, org, address verified |
| Reliability | 20% | Completion, acceptance, deadlines, response speed |
| Quality | 25% | Approval rate, revisions, review confidence |
| Behavior | 15% | Fraud, violations, warnings, suspensions, appeals |
| Experience | 10% | Completions, campaign/org diversity, tenure |
| Reputation | 10% | Org endorsements, verified recommendations |

## Output

```text
Overall score
Dimension scores
Trend (improving | stable | declining)
Reasons
Warnings
Last updated
AdvisoryOnly = true
```

Example:

```text
Overall Trust 91
Identity 98 · Reliability 94 · Quality 90 · Behavior 100 · Experience 82 · Reputation 69
Trend Improving
Reasons: Verified identity · Excellent completion · No fraud incidents
```

## Time decay

Event weights use exponential half-life (default **90 days**, `TRUST_DECAY_HALF_LIFE_DAYS`).

Recent positive/negative behavior influences scores more than old history.

## Trust events

`assignment_completed` · `submission_approved` · `submission_rejected` · `review_completed` · `payment_settled` · `fraud_confirmed` · `appeal_upheld` / `appeal_denied` · `identity_verified` · `email_verified` · `phone_verified` · `organization_endorsement` · `policy_violation` · `warning_issued` · `suspension`

Processed via:

```ts
import { processTrustDomainEvent } from "@/lib/trust/trust-service";

await processTrustDomainEvent({
  userId: "…",
  type: "submission_approved",
});
```

Foundation stores the event ledger **in-process** (not business data). Persisted `TrustProfile` tables are a later slice.

## Feature flags

| Flag | Role | Default |
| --- | --- | --- |
| `TRUST_ENGINE` | Master | on |
| `TRUST_EXPLAINABILITY` | Reasons / warnings | on |
| `TRUST_TRENDS` | Trend analysis | on |

Product flags: `trust.engine`, `trust.explainability`, `trust.trends`

## Admin

Command Center → **Trust Health**

Average score · distribution · rising / falling · newly verified · recalculations · event throughput · latency · errors

## Consumers (shared score)

- Match Engine ranking pool (`recommendation-service`)
- Worker Copilot facts (`worker-copilot-service`)

Both call `resolveOverallTrustScore` so heuristics are not duplicated.

## Tests

`lib/trust/trust-engine.test.ts`

Score · dimensions · time decay · trends · explainability · events · flags

## Explicit non-goals (4.2A)

- Persisted Prisma `TrustProfile` table (foundation uses process cache)
- Live Passport KYC hydration beyond email/phone
- Wiring every domain mutation to emit trust events yet
- Badges UI / public reputation pages

## Next

**4.2B** — Persist profiles, wire domain event hooks, Passport identity signals, endorsement model. ✅ See [PHASE_4_2B_TRUST_PERSISTENCE.md](./PHASE_4_2B_TRUST_PERSISTENCE.md).

**4.2C** — Trust Passport (shareable explainable reputation surface).

## Implementation Report

1. **Features:** Trust Engine + 6 dimensions + decay + trends + explanations + event processor + Trust Health  
2. **Created:** `lib/trust/*`, `features/admin/services/trust-health.ts`, `docs/PHASE_4_2A_TRUST_FOUNDATION.md`  
3. **Modified:** Command Center, admin page, env, feature flags, `constants/trust.ts`, ranking + worker copilot score bridges, ROADMAP  
4. **Database:** none (read-only signal load; in-memory profile/event cache)  
5. **Routes:** none  
6. **Env:** `TRUST_ENGINE`, `TRUST_EXPLAINABILITY`, `TRUST_TRENDS`, `TRUST_DECAY_HALF_LIFE_DAYS`  
7. **Security:** No cross-user writes; trust updates only via trust services  
8. **Performance:** Pure calc in-process; Prisma load capped at 500 rows/user  
9. **Tests:** `trust-engine.test.ts` (17)  
10. **TODOs:** Persist profiles; emit events from review/settlement/fraud services; Passport gov-ID  
11. **Production readiness:** Calculator + flags + admin ready; persistence and full event wiring next  
