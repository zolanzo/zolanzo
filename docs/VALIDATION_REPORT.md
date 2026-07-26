# Validation Report

Immutable record (`VAL-…`) produced when the pipeline finishes.

Includes:

- `overallStatus`: `passed` | `passed_with_warnings` | `failed` | `needs_human`
- `overallScore`
- `results[]` (per-validator)
- `warnings` / `failures`
- `passedChecks` / `skippedChecks`
- `durationMs` / `generatedAt`
- `profileSnapshot` (frozen profile at run time)
- linked **Validation Evidence Snapshot**

Human reviewers (future) consume this report — they do not re-run validation.
