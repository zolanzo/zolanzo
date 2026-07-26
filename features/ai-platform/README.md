# features/ai-platform

## Bounded context
**AI Plugin Platform (Sprint 15)**

AI never owns workflows. Plugins register with capabilities, receive immutable **AI Context**, and return structured recommendations. Domain remains authoritative. AI-assisted human decisions produce **Decision Records** (`DEC-…`).

```
Extension Point → Registry → Plugin → Recommendation → (optional) Decision Record
```

See [docs/AI_PLATFORM.md](../../docs/AI_PLATFORM.md).
