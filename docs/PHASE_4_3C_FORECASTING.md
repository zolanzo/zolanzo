# Phase 4.3C — Forecasting & Decision Intelligence

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.3B Executive Dashboards](./PHASE_4_3B_EXECUTIVE_DASHBOARDS.md)

## Mission

Move from descriptive analytics to **predictive, advisory** decision support.

> Forecasts never mutate domain state.  
> Every prediction includes confidence, inputs, model version, and `advisoryOnly: true`.

## Architecture

```text
AnalyticsService (+ Trust telemetry + AI telemetry)
        ↓
 ForecastEngine
        ↓
 ForecastRegistry (versioned models)
        ↓
 RecommendationBuilder
        ↓
 ForecastCache → Dashboards / Copilots
```

Package: `lib/analytics/forecast/`

| Component | Path |
| --- | --- |
| ForecastService | `forecast-service.ts` |
| ForecastEngine | `forecast-engine.ts` |
| ForecastRegistry | `forecast-registry.ts` |
| RecommendationBuilder | `recommendation-builder.ts` |
| ForecastCache | `cache.ts` |

## Forecast types

Campaign · Workforce · Finance · Trust · Reviews · AI Operations

## Prediction output

- Predictions (key, label, value, unit, horizon, risk)
- Confidence 0–100 + band
- Inputs used (source + keys + sample size)
- Model version
- Recommendations (tied to prediction keys)
- `advisoryOnly: true`
- Generated / last refresh timestamps

## Feature flags

| Flag | Default |
| --- | --- |
| `FORECAST_ENGINE` | on |
| `FORECAST_RECOMMENDATIONS` | on |
| `FORECAST_MODELS` | on |

Product flags: `analytics.forecast_engine`, `analytics.forecast_recommendations`, `analytics.forecast_models`

## Public API

```ts
import { ForecastService } from "@/lib/analytics/forecast";

const forecast = await ForecastService.get({
  type: "campaign",
  campaignId: "CMP-…",
  permissions: ["analytics.read"],
});
// forecast.advisoryOnly === true
```

Copilot bridge:

```ts
import { getForecastSnippetForCopilot } from "@/lib/analytics/forecast";
```

## Consumers

- Campaign / Executive dashboards — ETA widget via Forecast Engine
- Organization Copilot — attaches advisory forecast findings on relevant intents
- Worker Copilot — `getForecastSnippetForCopilot` available for trust/workforce
- Finance / Operations dashboards — same Analytics + Forecast APIs

## Admin

Command Center → **Forecast Health**

Jobs · latency · freshness · confidence distribution · failures · cache hit rate

## Tests

`lib/analytics/forecast/forecast.test.ts`

Generation · confidence · caching · recommendations · flags · permissions

## Explicit non-goals

- Domain mutations or auto-scaling actions
- Live ML training pipelines
- Scheduled PDF exports (4.3D)

## Next

**4.3D — Scheduled Reports & Data Exports** ✅ See [PHASE_4_3D_REPORTS_AND_EXPORTS.md](./PHASE_4_3D_REPORTS_AND_EXPORTS.md).

**Phase 4.3 Business Intelligence complete.** Next: **4.4 Workflow Automation**.

## Implementation Report

1. **Features:** Six forecast domains, recommendations, cache, Forecast Health, dashboard ETA + org copilot bridge  
2. **Created:** `lib/analytics/forecast/*`, `forecast-health.ts`, this doc  
3. **Modified:** env, feature flags, Command Center, admin page, dashboards (ETA widget), org copilot, ROADMAP  
4. **Database:** none  
5. **Routes:** none  
6. **Env:** `FORECAST_ENGINE`, `FORECAST_RECOMMENDATIONS`, `FORECAST_MODELS`  
7. **Security:** advisory-only; permission filters on sensitive recommendations  
8. **Performance:** TTL cache; weekly analytics window; no domain writes  
9. **Tests:** `forecast.test.ts` (+ dashboard ETA assertion update)  
10. **TODOs:** geo regional models; richer TrustProfileService history curves  
11. **Production readiness:** forecast API ready on top of 4.3A/B  
