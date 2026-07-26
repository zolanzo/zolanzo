# Validator Pipeline

Ordered execution of independent validators.

| Validator | Role |
| --- | --- |
| `manifest` | Manifest finalized + has items |
| `evidence` | Structural integrity of evidence items |
| `step_completion` | Required steps from Submission Summary |
| `timing` | Time-spent vs profile minimum |
| `rule` | Profile `ruleKeys` (require_image, min_evidence_count, …) |
| `execution_context` | Execution Context snapshot integrity |
| `file_reference` | Blob `EvidenceReference` shape |
| `gps` | Placeholder geofence / coordinates |
| `device` | Placeholder device fingerprint |

Each returns:

```
{ validatorName, status, score, durationMs, messages[], metadata }
```

Pipeline aggregates via `aggregateValidatorResults`.
