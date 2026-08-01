# features/analytics

## Bounded context
**Business Intelligence** (Phase 4.3) — **complete**

## Responsibility
Domain modules emit analytics events via `safeRecordAnalyticsEvent`.
Analytics owns ledger/rollups/snapshots.
Dashboards present view models.
Forecasts produce advisory predictions.
Reports assemble deliverables (PDF/CSV/XLSX/JSON) on schedules.

```ts
import {
  AnalyticsService,
  DashboardService,
  ForecastService,
  ReportService,
} from "@/lib/analytics";
```

See:
- `docs/PHASE_4_3A_ANALYTICS_FOUNDATION.md`
- `docs/PHASE_4_3B_EXECUTIVE_DASHBOARDS.md`
- `docs/PHASE_4_3C_FORECASTING.md`
- `docs/PHASE_4_3D_REPORTS_AND_EXPORTS.md`

## Status
Phase 4.3A–D complete.
