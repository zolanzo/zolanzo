# Phase 4.1F — Worker Copilot

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.1E Organization Copilot](./PHASE_4_1E_ORGANIZATION_COPILOT.md)

## Mission

Help workers complete work successfully (acceptance, completion, approval, earnings, satisfaction).

- **Never** performs business actions
- **Never** modifies domain data
- **Self-scoped only** — no other workers, no org-private metrics, no internal review notes
- Rule/templates always work; AI polish optional
- Permissions enforced via existing RBAC

## Pipeline

```text
Worker Question
  ↓
Intent Detection
  ↓
Permission Filter (self-only)
  ↓
Knowledge Retrieval
  ↓
Assignment Context / Progress Analyzer
  ↓
Response Builder
  ↓
Recommendation Builder
  ↓
Worker Copilot Response (advisoryOnly)
```

## Package

| Component | Path |
| --- | --- |
| WorkerIntentResolver | `lib/ai/copilot/worker-intent-resolver.ts` |
| PermissionFilter | `lib/ai/copilot/worker-permission-filter.ts` |
| KnowledgeRetriever | `lib/ai/copilot/worker-knowledge-retriever.ts` |
| AssignmentContextBuilder | `lib/ai/copilot/assignment-context-builder.ts` |
| ProgressAnalyzer | `lib/ai/copilot/progress-analyzer.ts` |
| RecommendationBuilder | `lib/ai/copilot/worker-recommendation-builder.ts` |
| ConversationMemory | `lib/ai/memory/session-memory.ts` (session-scoped) |
| WorkerCopilot | `lib/ai/copilot/worker-copilot.ts` |
| WorkerCopilotService | `lib/ai/copilot/worker-copilot-service.ts` |

## Supported questions

My assignments · Next best task · Highest pay today · Nearby work · Deadlines · Submission status · Missing evidence · Rejection reason · Approval history · Trust score · Weekly earnings · Payment history · Assignment coach · Progress · Improvement tips

## Assignment Coach

For an active assignment:

- Checklist / progress %
- Evidence required vs present
- GPS requirement
- Photos remaining
- Time remaining
- Completion estimate
- Common mistakes
- Ready to submit?

## Progress Coach

- Assignments completed
- Approval rate
- Trust score
- Earnings this week
- Upcoming deadlines
- Average review / payment time
- Suggested improvements

## Output

```text
Answer
Confidence
Key findings
Recommendations (with reason, payout, confidence, expected approval)
Suggested follow-up questions
Assignment coach lines (when relevant)
Progress summary (when relevant)
AdvisoryOnly = true
```

## Recommendations (explainable)

Example shape:

- Complete Assignment ASN-245 today
- Reason: Expires in ~4 hours
- Estimated payout: ₦15,000
- Confidence: 90%+
- Expected approval: high / medium / low
- Workflow hint only (never executes)

## Conversation memory

Session-scoped via `lib/ai/memory` — supports “Why?”, “Show nearby work instead”, “What pays more?”, “Which one finishes fastest?”  
**Not** persisted as business data.

## Permissions

- `actorUserId` **must equal** `workerUserId`
- Intent → permission (e.g. `assignments.read`, `wallet.read`, `workers.profile.read`)
- Facts loader queries only the signed-in worker’s rows
- Reviewer `comments` are never loaded

## Feature flags

| Flag | Role | Default |
| --- | --- | --- |
| `AI_WORKER_COPILOT` | Master | on |
| `AI_WORKER_MEMORY` | Session memory | on |
| `AI_WORKER_RECOMMENDATIONS` | Action suggestions | on |
| `AI_ENABLED` | Mild answer polish | off |

Product flags: `ai.worker_copilot`, `ai.worker_memory`, `ai.worker_recommendations`

## Admin

Command Center → **Worker Copilot Health**

Questions · latency · confidence · AI vs rule · tokens · cost · errors

## API

```ts
import { askWorkerCopilotService } from "@/lib/ai/copilot/worker-copilot-service";

const response = await askWorkerCopilotService({
  workerUserId: "…", // must equal actorUserId
  actorUserId: "…",
  question: "What should I do next?",
  permissions: ["assignments.read", "submissions.create", "wallet.read"],
});
// response.advisoryOnly === true — never executes actions
```

## Tests

`lib/ai/copilot/worker-copilot.test.ts`

Intent · knowledge · permissions · assignment coach · progress coach · recommendations · memory · fallback · flags

## Explicit non-goals

- Claiming, submitting, or withdrawing on the worker’s behalf
- Persisting chat as domain entities
- Exposing org metrics or other workers
- Starting Phase 4.2 Trust & Reputation (next milestone)

## Phase 4.1 complete

With 4.1F, the AI Intelligence Engine covers:

| Module | Role |
| --- | --- |
| Match Engine | Worker discovery |
| Fraud Detection | Submission risk |
| Review Assistant | Reviewer productivity |
| Organization Copilot | Org decision support |
| Worker Copilot | Worker guidance |

Suggested next: **Phase 4.2 — Trust & Reputation Engine**.

## Implementation Report

1. **Features:** Worker Copilot + Assignment/Progress coaches + session memory + Worker Copilot Health  
2. **Created:** `lib/ai/copilot/worker-*`, `assignment-context-builder.ts`, `progress-analyzer.ts`, `worker-copilot*.ts`, `features/admin/services/worker-copilot-health.ts`, `docs/PHASE_4_1F_WORKER_COPILOT.md`  
3. **Modified:** Command Center, admin page, env, feature flags, ROADMAP, `lib/ai` exports, foundation tests  
4. **Database:** none (read-only queries in service)  
5. **Routes:** none  
6. **Env:** `AI_WORKER_COPILOT`, `AI_WORKER_MEMORY`, `AI_WORKER_RECOMMENDATIONS`  
7. **Security:** Self-only actor/worker gate; intent permissions; no internal review comments  
8. **Performance:** In-process intent/retrieval; facts load capped  
9. **Tests:** `worker-copilot.test.ts` (19) + foundation update  
10. **TODOs:** Wire worker chat UI; richer GPS radius from live device  
11. **Production readiness:** Rule Q&A ready; AI polish opt-in; no writes  
