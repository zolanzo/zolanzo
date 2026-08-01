# Phase 4.4C — Visual Rule Builder

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** Phase 4.4B Automation Library

## Mission

Build a visual, validated rule authoring experience on top of the Automation Engine.

The builder **does not execute workflows**. It produces standard automation rules stored and executed exclusively by `AutomationService`.

```text
Template (optional)
        │
Visual Rule Builder
        │
Trigger → Conditions → Actions → Validation → Preview
        │
AutomationService.createRule()
```

## Architecture

```text
RuleBuilderService
  ├── TriggerPicker
  ├── ConditionBuilder
  ├── ActionBuilder
  ├── RuleValidator
  ├── RulePreview
  ├── SimulationEngine   (dry-run only)
  └── RuleSerializer     (JSON import/export)
        │
        ▼
AutomationService.createRule()
```

Package: `lib/automation/builder/`

| Component | Path |
| --- | --- |
| RuleBuilderService | `builder-service.ts` |
| TriggerPicker | `trigger-picker.ts` |
| ConditionBuilder | `condition-builder.ts` |
| ActionBuilder | `action-builder.ts` |
| RuleValidator | `rule-validator.ts` |
| RulePreview | `rule-preview.ts` |
| SimulationEngine | `simulation-engine.ts` |
| RuleSerializer | `rule-serializer.ts` |

## Features

- Visual trigger selection (grouped: assignments, reviews, campaigns, payments, trust, analytics, forecasts, reports, organizations, workers)
- Nested AND/OR condition trees (eq/neq/gt/gte/lt/lte/in/contains/exists)
- Action selection from Action Registry with param schemas, permissions, cost, retry, timeout
- Live structured validation
- Rule preview (trigger → conditions → template → actions → permissions → flow)
- Simulation dry-run with sample payloads
- JSON import/export with version metadata
- Rule cloning
- Library template prefill

## Validation codes

`unknown_trigger` · `invalid_condition` · `invalid_tree` · `invalid_operator` · `missing_parameter` · `unsupported_action` · `permission_mismatch` · `feature_flag` · `version_incompatible` · `empty_actions` · `empty_name`

## Simulation

Dry-run only. Uses `ConditionEvaluator` against sample payloads. Reports matched conditions, actions that *would* run, warnings, and estimated latency. **No domain actions execute.**

## Feature flags

| Flag | Default |
| --- | --- |
| `AUTOMATION_BUILDER` | on (requires engine) |
| `AUTOMATION_SIMULATION` | on (requires builder) |
| `AUTOMATION_IMPORT_EXPORT` | on (requires builder) |

Product flags: `automation.builder`, `automation.simulation`, `automation.import_export`

## Admin

Command Center → **Rule Builder Health**

- Rules created  
- Simulations run  
- Validation failures  
- Import / export usage  
- Average build time  

## Rules

1. Builder never introduces a second execution path.  
2. Persist only through `AutomationService.createRule`.  
3. Actions come only from the Action Registry.  
4. Simulation is dry-run only.  

## Tests

`lib/automation/builder/builder.test.ts` — validation, simulation, serialization, import/export, permissions, feature flags, rule generation, nested conditions.

## Implementation Report

1. **Features:** RuleBuilderService, catalogs, validator, preview, simulation, JSON I/O, clone, template prefill, Builder Health  
2. **Created:** `lib/automation/builder/*`, `features/admin/services/rule-builder-health.ts`, this doc  
3. **Modified:** `lib/automation/index.ts`, feature flags, env, `.env.example`, command center, admin page, ROADMAP, 4.4B next pointer  
4. **Database:** none  
5. **Routes:** none (authoring API + Command Center panel)  
6. **Env:** `AUTOMATION_BUILDER`, `AUTOMATION_SIMULATION`, `AUTOMATION_IMPORT_EXPORT`  
7. **Security:** permission-aware validation; flag gates; no domain DB writes from builder  
8. **Performance:** in-memory catalogs; simulation is pure evaluation  
9. **Tests:** `builder.test.ts`  
10. **TODOs:** YAML export optional; UI shell for builder; governance (4.4D)  
11. **Production readiness:** authoring API ready for UI consumption; execution remains in engine  

## Next

**Phase 4.4D — Automation Governance** ✅ See [PHASE_4_4D_AUTOMATION_GOVERNANCE.md](./PHASE_4_4D_AUTOMATION_GOVERNANCE.md). **Phase 4.4 complete.**
