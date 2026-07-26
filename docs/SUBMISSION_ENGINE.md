# Submission Engine

A **Submission** is an immutable **Submission Package** created from an Assignment Workspace.

```
Assignment → Draft Package → Evidence Manifest → Submit → Immutable Package (SUB-…)
```

## Package contents

- Metadata + status
- Execution Context snapshot
- Device / GPS / timing snapshots
- Evidence Manifest + items
- Auto-generated Submission Summary

Evidence is never vendor-bound — only `EvidenceReference` via adapters.

Module: `features/submissions`
