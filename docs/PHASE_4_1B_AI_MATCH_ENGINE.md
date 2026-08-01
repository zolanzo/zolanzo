# Phase 4.1B — AI Match Engine

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.1A AI Foundation](./PHASE_4_1A_AI_FOUNDATION.md)

## Mission

Recommend workers most likely to complete a campaign successfully.

- **Never assigns** automatically
- Advisory recommendations only
- Rule score always works when AI is off
- AI confidence **augments** the rule score; it does not replace it

## Pipeline

```text
Campaign
  ↓
CandidateGenerator      # who can do the work
  ↓
EligibilityFilter       # who is allowed (marketplace evaluator)
  ↓
ScoreBuilder            # multi-signal rule score
  ↓
AI Confidence (opt)     # augment when AI_ENABLED
  ↓
ExplanationBuilder      # why this score
  ↓
Fairness adjustments    # rotation / new worker / region
  ↓
Top N Recommendations
```

## Package

| Component | Path |
| --- | --- |
| CandidateGenerator | `lib/ai/ranking/candidate-generator.ts` |
| EligibilityFilter | `lib/ai/ranking/eligibility-filter.ts` |
| ScoreBuilder | `lib/ai/ranking/score-builder.ts` |
| ExplanationBuilder | `lib/ai/ranking/explanation-builder.ts` |
| Fairness | `lib/ai/ranking/fairness.ts` |
| RankingEngine | `lib/ai/ranking/ranking-engine.ts` |
| RecommendationService | `lib/ai/ranking/recommendation-service.ts` |

## Signals

Trust · Completion rate · Approval rate · Experience · Availability / workload · Geography · Organization history · Response speed · Cost · Skills · AI confidence

## Scoring

- **Rule score** — additive contributions (0–100)
- **AI confidence** (0–1) — signal completeness heuristic; used only when `AI_ENABLED`
- **Final** — `ruleScore` when AI off; `ruleScore + (aiConfidence - 0.5) * 10` when AI on  
  Example: rule **87** + confidence **0.94** → final **91**

## Explainability

Each recommendation includes:

- `matchScore`, `ruleScore`, `confidence`, `aiConfidence`
- `reasons` (e.g. `+18 Nearby`, `+15 Trusted by this organization`)
- `warnings` (e.g. current workload)
- `label`: Highly Recommended · Recommended · Consider · Low Fit

Gate: `AI_EXPLAINABILITY` (default on).

## Fairness (tunable policy)

- New worker boost
- Organization preference
- Opportunity rotation (workload dampening)
- Regional balance
- Diversity factor

Gate: `AI_FAIRNESS` (default on). Policy via `FairnessPolicy` / `DEFAULT_FAIRNESS_POLICY`.

## Feature flags

| Flag | Role |
| --- | --- |
| `AI_MATCH_ENGINE` | Master switch (default on) |
| `AI_EXPLAINABILITY` | Reason deltas (default on) |
| `AI_FAIRNESS` | Balancing (default on) |
| `AI_ENABLED` | AI confidence augment |
| Product: `ai.ranking`, `ai.explainability`, `ai.fairness` | Plan gates |

## Output

Top **10** recommendations (configurable `topN`). Each includes score, confidence, reasons, warnings. `advisoryOnly: true`.

```ts
import { recommendWorkersForCampaign } from "@/lib/ai/ranking/recommendation-service";

const result = await recommendWorkersForCampaign({
  campaignId: "CMP-…",
  topN: 10,
});
// result.recommendations — never mutates assignments
```

## Admin

Command Center → **Ranking Health**

- Match engine / fairness / explainability / AI augment
- Requests · failures · average score · average latency
- Fallback usage · AI augment count

## Tests

`lib/ai/ranking/match-engine.test.ts`

- Candidate generation
- Eligibility
- Ranking
- Explainability
- Fairness
- Feature flags
- Fallback when disabled
- AI score formula (87 + 0.94 → 91)

## Explicit non-goals

- Auto-assignment / claim
- Lottery / invite sending
- Fraud detection (→ 4.1C)
- Review assistant (→ 4.1D)
- Copilots (→ 4.1E/F)
- Persisted skill profiles (uses available Profile + assignment signals)

## Next

**4.1C — AI Fraud Detection** — implement `FraudDetector` with risk scoring before human review.

## Implementation Report

1. **Features:** Production RankingEngine + match pipeline + fairness + explainability + Ranking Health  
2. **Created:** `lib/ai/ranking/*` match modules, `features/admin/services/ranking-health.ts`, `docs/PHASE_4_1B_AI_MATCH_ENGINE.md`  
3. **Modified:** Command Center, admin page, env, feature flags, ROADMAP, `lib/ai` exports/types  
4. **Database:** none  
5. **Routes:** none  
6. **Env:** `AI_MATCH_ENGINE`, `AI_EXPLAINABILITY`, `AI_FAIRNESS`  
7. **Security:** Advisory only; reuses marketplace eligibility; no domain writes  
8. **Performance:** In-process scoring; candidate pool capped (~200); ranking telemetry ring  
9. **Tests:** `match-engine.test.ts`  
10. **TODOs:** Richer skills/distance when Profile fields land; optional LLM confidence in later polish  
11. **Production readiness:** Rule ranking ready; AI augment opt-in via `AI_ENABLED`; does not auto-assign  
