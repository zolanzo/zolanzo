# Phase 4.1E — Organization Copilot

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.1D AI Review Assistant](./PHASE_4_1D_AI_REVIEW_ASSISTANT.md)

## Mission

Answer organizational questions using existing platform data.

- **Never** performs business actions
- **Never** modifies domain data
- Rule/templates always work; AI polish optional
- Permissions enforced — no privilege escalation

## Pipeline

```text
Manager Question
  ↓
Intent Detection
  ↓
Permission Filter
  ↓
Knowledge Retrieval
  ↓
Business Context Builder
  ↓
AI Response Generator (optional)
  ↓
Recommendation Builder
  ↓
Copilot Response (advisoryOnly)
```

## Package

| Component | Path |
| --- | --- |
| IntentResolver | `lib/ai/copilot/intent-resolver.ts` |
| KnowledgeRetriever | `lib/ai/copilot/knowledge-retriever.ts` |
| BusinessContextBuilder | `lib/ai/copilot/business-context-builder.ts` |
| RecommendationBuilder | `lib/ai/copilot/recommendation-builder.ts` |
| PermissionFilter | `lib/ai/copilot/permission-filter.ts` |
| ConversationMemory | `lib/ai/memory/session-memory.ts` (session-scoped) |
| OrganizationCopilot | `lib/ai/copilot/organization-copilot.ts` |
| OrganizationCopilotService | `lib/ai/copilot/organization-copilot-service.ts` |

## Supported questions

Campaign performance · Behind schedule · Top workers · Reviewer workload · Pending payments · Fraud trends · Completion rates · Regional performance · Org spending · Assignment backlog · Inactive workers

## Output

```text
Answer
Confidence
Data sources
Key findings
Recommendations (workflow hints only)
Suggested follow-up questions
AdvisoryOnly = true
```

## Conversation memory

Session-scoped via `lib/ai/memory` — supports “Why?” / “Show affected workers”.  
**Not** persisted as business data.

## Permissions

Requires active org membership + intent permission (e.g. `campaigns.read`, `payments.create`). Denied callers get an explicit advisory refusal.

## Feature flags

| Flag | Role | Default |
| --- | --- | --- |
| `AI_ORG_COPILOT` | Master | on |
| `AI_ORG_MEMORY` | Session memory | on |
| `AI_ORG_RECOMMENDATIONS` | Action suggestions | on |
| `AI_ENABLED` | Mild answer polish | off |

## Admin

Command Center → **Organization Copilot Health**

Questions · latency · confidence · AI vs rule · tokens · cost · errors

## API

```ts
import { askOrgCopilot } from "@/lib/ai/copilot/organization-copilot-service";

const response = await askOrgCopilot({
  organizationId: "ORG-…",
  actorUserId: "…",
  question: "Which campaigns are behind schedule?",
  isOrgMember: true,
  permissions: ["campaigns.read"],
});
// response.advisoryOnly === true — never executes actions
```

## Tests

`lib/ai/copilot/org-copilot.test.ts`

Intent · knowledge · permissions · memory · recommendations · fallback · flags

## Explicit non-goals

- Executing invites, budget changes, or reviews
- Persisting chat as domain entities
- Worker Copilot (→ 4.1F) ✅

## Next

**Phase 4.1 complete.** Suggested next: **4.2 — Trust & Reputation Engine**.

## Implementation Report

1. **Features:** Organization Copilot + session memory + Org Copilot Health  
2. **Created:** `lib/ai/copilot/org-*`, `organization-copilot*.ts`, `features/admin/services/org-copilot-health.ts`, `docs/PHASE_4_1E_ORGANIZATION_COPILOT.md`  
3. **Modified:** Command Center, admin page, env, feature flags, ROADMAP, `lib/ai` exports/types  
4. **Database:** none (read-only queries in service)  
5. **Routes:** none  
6. **Env:** `AI_ORG_COPILOT`, `AI_ORG_MEMORY`, `AI_ORG_RECOMMENDATIONS`  
7. **Security:** Permission + membership gates; advisory only  
8. **Performance:** In-process intent/retrieval; facts load capped  
9. **Tests:** `org-copilot.test.ts`  
10. **TODOs:** Wire chat UI; richer fraud telemetry join  
11. **Production readiness:** Rule Q&A ready; AI polish opt-in; no writes  
