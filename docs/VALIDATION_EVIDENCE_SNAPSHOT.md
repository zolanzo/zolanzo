# Validation Evidence Snapshot

When validation starts, the engine freezes every evidence item:

- evidence item id
- kind / label / stepKey
- EvidenceReference (adapter + container + objectKey)
- contentHash / sizeBytes
- inlinePayload / metadata
- createdAt

Validators operate only on this snapshot so every check in the pipeline sees the same evidence set.

Stored in `validation_evidence_snapshots` (1:1 with Validation Report).

Enables reproducible re-validation audits and dispute review without depending on later storage migrations.
