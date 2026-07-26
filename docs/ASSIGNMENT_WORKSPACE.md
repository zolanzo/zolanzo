# Assignment Workspace

An Assignment is the **worker's workspace** — not just a status row.

```
Assignment
├── Overview
├── Instructions (Campaign Brief)
├── Execution Steps (from Task Template)
├── Checklist
├── Progress
├── Timeline
├── Notes
├── Evidence Placeholder
└── Audit (Execution Context)
```

Hydrated at claim/confirm from the pinned Task Template version. No hardcoded per-campaign UI.

## Execution Context (immutable)

Frozen at assignment creation:

- Template + campaign revision markers
- Worker trust score
- Eligibility + claim policy evaluation results
- Device / country / language
- Active organization
- Reward snapshot

Module: `features/assignments`
