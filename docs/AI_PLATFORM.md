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

## Public IDs

- Executions: `AIX-…`
- Decision records: `DEC-…`

## Related

- [PLUGIN_REGISTRY.md](./PLUGIN_REGISTRY.md)
- [AI_CONTEXT.md](./AI_CONTEXT.md)
- [PLUGIN_CAPABILITIES.md](./PLUGIN_CAPABILITIES.md)
- [AI_POLICIES.md](./AI_POLICIES.md)
- [SPRINT_15_AI_REPORT.md](./SPRINT_15_AI_REPORT.md)
