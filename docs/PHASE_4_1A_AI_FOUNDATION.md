# Phase 4.1A — AI Intelligence Foundation

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** RC1 / Phase 3B provider wave  

## Mission

Build the AI foundation for Phase 4 (Intelligent Work Platform).

- AI is **advisory only**
- AI **never** modifies business data directly
- All writes continue through existing domain services
- Live LLM calls are opt-in behind `AI_ENABLED` + provider keys

## Package layout

Cursor task asked for `src/ai/`. Zolanzo convention uses `lib/` for infrastructure ports:

| Task path | Implemented path |
| --- | --- |
| `src/ai/` | `lib/ai/` |
| `engine/` | `lib/ai/engine/` |
| `providers/` | `lib/ai/providers/` |
| `prompts/` | `lib/ai/prompts/` |
| `embeddings/` | `lib/ai/embeddings/` |
| `ranking/` | `lib/ai/ranking/` |
| `review/` | `lib/ai/review/` |
| `fraud/` | `lib/ai/fraud/` |
| `copilot/` | `lib/ai/copilot/` |
| `knowledge/` | `lib/ai/knowledge/` |
| `memory/` | `lib/ai/memory/` |
| `telemetry/` | `lib/ai/telemetry/` |

Existing Sprint 15 plugin platform (`lib/integrations/ai/`, `features/ai-platform/`) remains for capability plugins. Phase 4.1A adds the **LLM / intelligence engine** layer those plugins can later consume.

## Architecture

```
Presentation (Admin AI Health)
        ↓
AI Service (invokeIntelligence)
        ↓
AI Engine (timeouts · retries · rate limit · correlation)
        ↓
Providers (Mock | OpenAI HTTP adapter)
        ↓
Knowledge Layer (read-only snapshots)
        ↓
Domain / Prisma (reads only)
```

Writes: **forbidden** from this layer. Recommendations must re-enter domain services (campaigns, review, marketplace, etc.).

## Interfaces

| Port | Status |
| --- | --- |
| `AIProvider` (`IntelligenceLlmProvider`) | ✅ Mock + OpenAI adapters |
| `EmbeddingProvider` | ✅ Mock + OpenAI adapters |
| `RankingEngine` | ✅ Interface + stub (throws) |
| `FraudDetector` | ✅ Interface + stub (throws) |
| `ReviewAssistant` | ✅ Interface + stub (throws) |
| `OrganizationCopilot` | ✅ Interface + stub (throws) |
| `WorkerCopilot` | ✅ Interface + stub (throws) |

## Implemented runtime

- Feature flags / env: `AI_ENABLED`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`
- Product flags: `ai.intelligence`, `ai.ranking`, `ai.fraud`, `ai.review_assistant`, `ai.org_copilot`
- Prompt registry + `{{variable}}` render
- Structured JSON parser (fenced / embedded)
- Timeouts, retries, in-process rate limiting
- Correlation IDs (`aic-…`)
- Audit log + telemetry (requests, failures, latency, tokens, estimated USD cost)
- Knowledge snapshots: campaign, organization, worker, submission, payment summary, trust summary
- Admin **AI Health** on Command Center

## Environment

```bash
# Default: AI_ENABLED unset/false → disabled (health probes still use mock)
AI_ENABLED=1
AI_PROVIDER=openai   # or mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

OpenAI adapter uses **HTTP only** (no SDK). Without a key it returns stub JSON (same pattern as Paystack / Resend).

## Admin

Command Center → **AI Health**

- Provider / model / runtime mode
- Requests · failures · avg latency
- Estimated token cost
- Health probe (`health.ping`)

## Tests

`lib/ai/ai-foundation.test.ts`

- Adapters (mock + OpenAI fetch stub)
- Feature flags / provider switching
- Timeouts · retries
- Audit + telemetry
- Capability ports remain unimplemented

## Explicit non-goals (4.1A)

- Worker match scoring (→ **4.1B**)
- Fraud ML
- Reviewer assistant UX
- Organization / worker chat UX
- Live OpenAI credentials in CI
- Domain mutations from AI

## Next

**Phase 4.1B — AI Match Engine** — implement `RankingEngine` with objective platform signals (skills, completion, trust proxies, location, cost, history).

## Implementation Report

1. **Features:** AI foundation package, OpenAI/Mock adapters, knowledge reads, admin AI Health  
2. **Created:** `lib/ai/**`, `features/admin/services/ai-health.ts`, `docs/PHASE_4_1A_AI_FOUNDATION.md`  
3. **Modified:** Command Center, admin page, env validation, `.env.example`, feature flags, ROADMAP  
4. **Database:** none  
5. **Routes:** none (admin UI panel only)  
6. **Env vars:** `AI_ENABLED`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`  
7. **Security:** AI cannot write domain; keys optional; correlation IDs on outbound calls; advisory audit only  
8. **Performance:** timeouts/retries/rate limits; in-process telemetry ring buffers  
9. **Tests:** `lib/ai/ai-foundation.test.ts`  
10. **TODOs:** ranking / fraud / review / copilot logic in later 4.1 slices  
11. **Production readiness:** foundation ready; live OpenAI opt-in only; capability engines not yet productized  
