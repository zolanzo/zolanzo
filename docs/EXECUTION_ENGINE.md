# Execution Engine

Ordered execution flow derived from Task Template `capabilitySet`.

```
Install → Open → Register → Use → Capture → Rate → Submit
```

Each step includes:

- `sequence`, `stepKey`, `capability`, `instruction`
- `required` / optional
- `dependsOnStepKeys` (default: previous step)
- `conditionalKey` (future-ready)
- `estimatedDurationMin`

Persisted as immutable `ExecutionStep` rows + live `AssignmentStep` checklist.

Implementation: `features/assignments/services/execution-engine.ts`
