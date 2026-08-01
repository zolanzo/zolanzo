# AI Plugin Platform

AI enhances ZOLANZO — it never owns workflows.

```text
Domain Event / Extension Point
    ↓
Plugin Registry (capability match)
    ↓
Immutable AI Context
    ↓
AI Plugin
    ↓
Structured Recommendation
    ↓
(optional) Decision Record (DEC-…)
    ↓
Domain Service (human-gated)
```

## Principles

1. Domain remains authoritative.
2. Plugins are selected by **capability**, not model name.
3. Plugins receive snapshots — they do not query live domain data.
4. Results are structured and machine-readable.
5. Policies gate execution; `automatic` is future-ready and still non-mutating.
6. No live LLM SDKs in Sprint 15 (Memory executes; others stub).
7. Phase 4.1A adds `lib/ai/` LLM adapters (HTTP OpenAI / Mock) — still advisory; see [PHASE_4_1A_AI_FOUNDATION.md](./PHASE_4_1A_AI_FOUNDATION.md).
8. Phase 4.1B Match Engine ranks workers with explainable rule scores (+ optional AI confidence); never assigns — see [PHASE_4_1B_AI_MATCH_ENGINE.md](./PHASE_4_1B_AI_MATCH_ENGINE.md).
9. Phase 4.1C Fraud Detection assesses submission risk with rule + optional AI enrichment; never enforces — see [PHASE_4_1C_AI_FRAUD_DETECTION.md](./PHASE_4_1C_AI_FRAUD_DETECTION.md).
10. Phase 4.1D Review Assistant summarizes submissions for reviewers; never decides — see [PHASE_4_1D_AI_REVIEW_ASSISTANT.md](./PHASE_4_1D_AI_REVIEW_ASSISTANT.md).
11. Phase 4.1E Organization Copilot answers org questions with permission filters; never acts — see [PHASE_4_1E_ORGANIZATION_COPILOT.md](./PHASE_4_1E_ORGANIZATION_COPILOT.md).
12. Phase 4.1F Worker Copilot guides workers with self-only retrieval + coaches; never acts — see [PHASE_4_1F_WORKER_COPILOT.md](./PHASE_4_1F_WORKER_COPILOT.md). **Phase 4.1 complete.**
13. Phase 4.2A Trust Foundation provides explainable, time-decayed trust scores as a platform primitive — see [PHASE_4_2A_TRUST_FOUNDATION.md](./PHASE_4_2A_TRUST_FOUNDATION.md).
14. Phase 4.2B persists TrustProfiles and wires domain events (idempotent ledger + DLQ) — see [PHASE_4_2B_TRUST_PERSISTENCE.md](./PHASE_4_2B_TRUST_PERSISTENCE.md).
15. Phase 4.2C Trust Passport presents explainable private/org/public reputation views — see [PHASE_4_2C_TRUST_PASSPORT.md](./PHASE_4_2C_TRUST_PASSPORT.md). **Phase 4.2 complete.**

## Public IDs

- Executions: `AIX-…`
- Decision records: `DEC-…`

## Related

- [PHASE_4_1A_AI_FOUNDATION.md](./PHASE_4_1A_AI_FOUNDATION.md)
- [PHASE_4_1B_AI_MATCH_ENGINE.md](./PHASE_4_1B_AI_MATCH_ENGINE.md)
- [PHASE_4_1C_AI_FRAUD_DETECTION.md](./PHASE_4_1C_AI_FRAUD_DETECTION.md)
- [PHASE_4_1D_AI_REVIEW_ASSISTANT.md](./PHASE_4_1D_AI_REVIEW_ASSISTANT.md)
- [PHASE_4_1E_ORGANIZATION_COPILOT.md](./PHASE_4_1E_ORGANIZATION_COPILOT.md)
- [PHASE_4_1F_WORKER_COPILOT.md](./PHASE_4_1F_WORKER_COPILOT.md)
- [PHASE_4_2A_TRUST_FOUNDATION.md](./PHASE_4_2A_TRUST_FOUNDATION.md)
- [PHASE_4_2B_TRUST_PERSISTENCE.md](./PHASE_4_2B_TRUST_PERSISTENCE.md)
- [PHASE_4_2C_TRUST_PASSPORT.md](./PHASE_4_2C_TRUST_PASSPORT.md)
- [PLUGIN_REGISTRY.md](./PLUGIN_REGISTRY.md)
- [AI_CONTEXT.md](./AI_CONTEXT.md)
- [PLUGIN_CAPABILITIES.md](./PLUGIN_CAPABILITIES.md)
- [AI_POLICIES.md](./AI_POLICIES.md)
- [SPRINT_15_AI_REPORT.md](./SPRINT_15_AI_REPORT.md)
