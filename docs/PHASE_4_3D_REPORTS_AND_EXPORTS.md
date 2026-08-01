# Phase 4.3D — Scheduled Reports & Data Exports

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.3C Forecasting](./PHASE_4_3C_FORECASTING.md)

## Mission

Turn analytics and forecasts into **deliverables**.

> Reports consume Analytics, Trust, Forecast, and Dashboard services.  
> Reports never compute metrics.  
> Reports never modify domain state.

## Architecture

```text
Analytics / Trust / Forecast / Dashboards
                ↓
          ReportService
                ↓
          ReportBuilder
                ↓
         RendererRegistry
                ↓
          ExportService
                ↓
         ScheduleService → Storage
```

Package: `lib/analytics/reports/`

| Component | Path |
| --- | --- |
| ReportService | `report-service.ts` |
| ReportBuilder | `report-builder.ts` |
| RendererRegistry | `renderer-registry.ts` |
| ExportService | `export-service.ts` |
| ScheduleService | `schedule-service.ts` |

## Report types

Executive · Campaign · Finance · Trust · AI · Operations

## Export formats

| Format | Implementation |
| --- | --- |
| JSON | Canonical `ReportDocument` |
| CSV | Flattened section rows |
| XLSX | SpreadsheetML (Excel-compatible, no native deps) |
| PDF | Minimal text PDF (no native deps) |

Renderers are replaceable via `RendererRegistry.register`.

## Scheduling

Daily · Weekly · Monthly · Quarterly · Manual

`analytics.project-snapshot` job also executes due report schedules.

## Feature flags

| Flag | Default |
| --- | --- |
| `REPORTS_ENGINE` | on |
| `REPORT_EXPORTS` | on |
| `REPORT_SCHEDULES` | on |

Product flags: `analytics.reports_engine`, `analytics.report_exports`, `analytics.report_schedules`

## Public API

```ts
import { ReportService } from "@/lib/analytics/reports";

const result = await ReportService.generate({
  type: "executive",
  format: "pdf",
  organizationId: "org_…",
});

ReportService.schedule({
  type: "finance",
  frequency: "weekly",
  format: "csv",
});

await ReportService.runSchedules();
```

## Admin

Command Center → **Reports Health**

Reports generated · export duration · queue depth · schedule executions · failures · storage · renderers

## Tests

`lib/analytics/reports/reports.test.ts`

Generation · export formats · schedules · permissions · flags · renderer registry

## Explicit non-goals

- Live email/webhook delivery channels (extensible later)
- Heavy native PDF/XLSX SDKs (swap via RendererRegistry)
- Direct domain table queries

## Phase 4.3 complete

| Slice | Status |
| --- | --- |
| 4.3A Analytics Foundation | ✅ |
| 4.3B Executive Dashboards | ✅ |
| 4.3C Forecasting | ✅ |
| 4.3D Reports & Exports | ✅ |

## Next

**Phase 4.4 Workflow Automation** — start with **4.4A** ✅ See [PHASE_4_4A_WORKFLOW_AUTOMATION_FOUNDATION.md](./PHASE_4_4A_WORKFLOW_AUTOMATION_FOUNDATION.md).

## Implementation Report

1. **Features:** Six report types, four export formats, schedules, Reports Health, job hook  
2. **Created:** `lib/analytics/reports/*`, `reports-health.ts`, this doc  
3. **Modified:** env, feature flags, Command Center, admin page, analytics job, ROADMAP  
4. **Database:** none (in-memory store; Prisma-ready API)  
5. **Routes:** none  
6. **Env:** `REPORTS_ENGINE`, `REPORT_EXPORTS`, `REPORT_SCHEDULES`  
7. **Security:** read-only; permission filters on sensitive sections; advisory documents  
8. **Performance:** lightweight renderers; schedule queue depth telemetry  
9. **Tests:** `reports.test.ts`  
10. **TODOs:** persistent report store; email delivery adapters  
11. **Production readiness:** API ready; swap storage/renderers as needed  
