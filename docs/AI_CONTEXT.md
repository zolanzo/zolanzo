# AI Context

Every plugin receives an immutable **AI Context** snapshot.

## Fields

| Field | Purpose |
| --- | --- |
| entity reference | type + id + public id |
| versionSnapshots | frozen versions |
| submissionSnapshot | package summary |
| evidenceSnapshot | evidence manifest slice |
| validationReport | validation outcome |
| reviewFindings | prior findings |
| executionContext | extension-point specifics |
| pluginConfiguration | per-plugin config |
| promptVariables | typed string vars |
| pluginMetadata | registry metadata |

Plugins never query Prisma/domain services directly. Callers assemble the snapshot before `runAiPlugin`.
