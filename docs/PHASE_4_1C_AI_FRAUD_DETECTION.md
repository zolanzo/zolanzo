# Phase 4.1C — AI Fraud Detection

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.1B AI Match Engine](./PHASE_4_1B_AI_MATCH_ENGINE.md)

## Mission

Evaluate submission risk so reviewers can prioritize attention.

- **Never** approves, rejects, or blocks submissions
- **Never** mutates business data
- Rule engine always runs; AI enriches when enabled
- Output is an advisory **risk assessment** with evidence

## Pipeline

```text
Submission
  ↓
EvidenceCollector
  ↓
RuleRiskEngine          # always
  ↓
AIRiskAnalyzer          # optional (AI_ENABLED)
  ↓
RiskAggregator
  ↓
ExplanationBuilder
  ↓
Reviewer-facing assessment (queue prioritization later)
```

## Package

| Component | Path |
| --- | --- |
| EvidenceCollector | `lib/ai/fraud/evidence-collector.ts` |
| RuleRiskEngine | `lib/ai/fraud/rule-risk-engine.ts` |
| AIRiskAnalyzer | `lib/ai/fraud/ai-risk-analyzer.ts` |
| RiskAggregator | `lib/ai/fraud/risk-aggregator.ts` |
| ExplanationBuilder | `lib/ai/fraud/explanation-builder.ts` |
| FraudDetector | `lib/ai/fraud/fraud-detector.ts` |
| FraudAssessmentService | `lib/ai/fraud/fraud-assessment-service.ts` |

## Rule signals

Identity verification · Device consistency / shared device · Submission completeness · Duplicate evidence (within + across) · Metadata consistency · GPS validation · Campaign boundary · Impossible travel · Submission timing / bursts · Historical rejection · Prior fraud indicators

## AI signals (optional)

Duplicate patterns · Suspicious narratives · Cross-submission similarity · Image quality proxies · Behavior anomalies

Bounded boost: AI adds **at most +20** to the rule score.

## Output

```text
Risk Score: 82
Level: HIGH
Confidence: 0.91
Reasons: + Duplicate image… · + GPS outside… · + Same device…
Warnings: Manual review recommended
Suggested actions: review_evidence · request_clarification · escalate…
advisoryOnly: true
```

## Feature flags

| Flag | Role | Default |
| --- | --- | --- |
| `AI_FRAUD_DETECTION` | Master switch | on |
| `AI_FRAUD_EXPLAINABILITY` | Reason text | on |
| `AI_DUPLICATE_ANALYSIS` | Hash / duplicate rules | on |
| `AI_GEO_ANALYSIS` | GPS / boundary / travel | on |
| `AI_ENABLED` | AI enricher | off |
| Product: `ai.fraud`, `ai.fraud_explainability`, `ai.duplicate_analysis`, `ai.geo_analysis` | Plan gates | business |

## Admin

Command Center → **Fraud Health**

- Assessments · high-risk count · average score · latency
- AI vs rule-only counts
- False-positive review rate (placeholder until feedback loop)

## API

```ts
import { assessSubmissionRisk } from "@/lib/ai/fraud/fraud-assessment-service";
import { assessSubmissionFraud } from "@/lib/ai/fraud";

// DB-backed
const assessment = await assessSubmissionRisk({ submissionId: "SUB-…" });

// Pure / tests
const assessment2 = await assessSubmissionFraud({ bundle, forceRuleOnly: true });
```

## Tests

`lib/ai/fraud/fraud-engine.test.ts`

- Rule engine · aggregation · explainability · flags · fallback without AI · duplicates · boundary validation · shared device · impossible travel

## Explicit non-goals

- Auto-reject / auto-approve
- Mutating review queues or submission status
- Live vision / LLM calls (heuristic enricher; LLM can plug in later)
- Training feedback loop in production decisions (telemetry hook reserved)

## Next

**4.1D — AI Review Assistant** — summarize findings for reviewers using validation + fraud assessments.

## Future note

Confirmed reviewer outcomes (`fraud confirmed` / `false alarm`) can feed an isolated learning signal via `recordFraudReviewFeedback` — never auto-enforcement.

## Implementation Report

1. **Features:** Advisory Fraud Detection Engine + Fraud Health  
2. **Created:** `lib/ai/fraud/*`, `features/admin/services/fraud-health.ts`, `docs/PHASE_4_1C_AI_FRAUD_DETECTION.md`  
3. **Modified:** Command Center, admin page, env, feature flags, ROADMAP, `lib/ai` exports/types  
4. **Database:** none  
5. **Routes:** none  
6. **Env:** `AI_FRAUD_DETECTION`, `AI_FRAUD_EXPLAINABILITY`, `AI_DUPLICATE_ANALYSIS`, `AI_GEO_ANALYSIS`  
7. **Security:** Advisory only; no domain writes; capability flags for incremental rollout  
8. **Performance:** In-process rules; assessment service uses bounded Prisma lookups  
9. **Tests:** `fraud-engine.test.ts`  
10. **TODOs:** Wire into review queue sort; reviewer feedback loop; optional LLM enricher  
11. **Production readiness:** Rule risk ready; AI enrich opt-in; no enforcement  
