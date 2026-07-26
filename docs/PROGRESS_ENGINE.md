# Progress Engine

Tracks:

- Step completion counts (required vs optional)
- Overall `progressPercent`
- `estimatedRemainingMin` from unfinished step estimates
- `readyForSubmission` when all required steps are completed/skipped
- `startedAt` / `lastActivityAt` / `completedAt`

Implementation: `features/assignments/services/progress-engine.ts`
