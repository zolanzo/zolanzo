# Phase 4.4A — Workflow Automation Foundation

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** Phase 4.3 Business Intelligence complete

## Mission

Build a configurable automation engine that **reacts to domain events** and invokes **existing services only**.

> Automation never bypasses domain services.  
> Automation never mutates domain tables directly.

## Architecture

```text
Domain Event
      ↓
Automation Engine
      ↓
Trigger Registry → Rule Engine → Condition Evaluator
      ↓
Action Registry → Existing Domain Services
      ↓
Execution Log (+ retries / DLQ)
```

Package: `lib/automation/`

| Component | Path |
| --- | --- |
| AutomationService | `automation-service.ts` |
| AutomationEngine | `automation-engine.ts` |
| TriggerRegistry | `trigger-registry.ts` |
| RuleEngine | `rule-engine.ts` |
| ConditionEvaluator | `condition-evaluator.ts` |
| ActionRegistry | `action-registry.ts` |
| ExecutionLog | `execution-log.ts` |
| AutomationScheduler | `automation-scheduler.ts` |

## Triggers

`worker.registered` · `campaign.created` · `assignment.accepted` · `assignment.completed` · `submission.approved` · `submission.rejected` · `payment.settled` · `trust.updated` · `forecast.generated` · `report.generated`

## Conditions

Composable AND/OR groups over fields such as organization, campaign, region, trust score, approval rate, assignment count, date/time, forecast confidence, payment status.

## Actions (domain services only)

| Action | Invokes |
| --- | --- |
| `send_notification` | Notification hub safe emit |
| `generate_report` | `ReportService.generate` |
| `schedule_report` | `ScheduleService.schedule` |
| `refresh_analytics_snapshot` | Analytics `rollup` + `snapshot` |
| `request_forecast_refresh` | `ForecastService.refresh` |
| `recalculate_trust` | `TrustProfileService.recalculate` |
| `create_review_task` | Queued signal (no direct DB) |
| `escalate_operations` | Escalation signal (no direct DB) |

## Execution safety

Idempotency keys · retries · dead-letter queue · action timeouts · correlation IDs · rule versioning · dry-run mode · execution history

## Feature flags

| Flag | Default |
| --- | --- |
| `AUTOMATION_ENGINE` | on |
| `AUTOMATION_RULES` | on |
| `AUTOMATION_ACTIONS` | on |

Product flags: `automation.engine`, `automation.rules`, `automation.actions`

## Wired emitters (initial)

| Domain | Trigger |
| --- | --- |
| Marketplace claim | `assignment.accepted` |
| Review decision | `submission.approved` / `submission.rejected` |
| Settlement release | `payment.settled` |

Scheduler retries drain via `analytics.project-snapshot` job.

## Public API

```ts
import { AutomationService } from "@/lib/automation";

AutomationService.createRule({
  name: "Escalate rejected submissions",
  trigger: "submission.rejected",
  conditions: {
    logic: "and",
    conditions: [{ field: "organizationId", op: "eq", value: "org_…" }],
  },
  actions: [{ type: "escalate_operations" }],
  dryRun: true,
});

await AutomationService.ingest({
  trigger: "submission.rejected",
  idempotencyKey: "…",
  payload: { submissionId: "SUB-…" },
});
```

## Admin

Command Center → **Automation Health**

Active rules · executions/hr · success rate · retries · DLQ · latency

## Tests

`lib/automation/automation.test.ts`

Trigger routing · conditions · actions · dry-run · idempotency · retry/DLQ · flags · enable/disable

## Explicit non-goals (4.4A)

- Visual rule builder (4.4C)
- Built-in automation library catalog UI (4.4B)
- Governance / approvals / rollback (4.4D)
- Direct Prisma writes from actions

## Next

**4.4B — Automation Library** ✅ See [PHASE_4_4B_AUTOMATION_LIBRARY.md](./PHASE_4_4B_AUTOMATION_LIBRARY.md). Next: **4.4C Visual Rule Builder**.

## Implementation Report

1. **Features:** Engine, triggers, conditions, actions, rules CRUD, dry-run, retries/DLQ, Automation Health, domain emits  
2. **Created:** `lib/automation/*`, `automation-health.ts`, this doc  
3. **Modified:** env, feature flags, Command Center, admin page, claim/review/settlement, analytics job, ROADMAP  
4. **Database:** none (in-memory store; Prisma-ready later)  
5. **Routes:** none  
6. **Env:** `AUTOMATION_ENGINE`, `AUTOMATION_RULES`, `AUTOMATION_ACTIONS`  
7. **Security:** actions call existing services; dry-run; no domain table writes  
8. **Performance:** idempotent executions; capped action timeout  
9. **Tests:** `automation.test.ts`  
10. **TODOs:** persist rules/executions; wire OPC escalate for real review queue items  
11. **Production readiness:** foundation API ready; expand library in 4.4B  
