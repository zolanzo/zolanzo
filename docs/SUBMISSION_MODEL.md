# Submission Model

## Purpose

A **Submission** is an immutable **Submission Package** proving an Assignment was performed — not a form.

Canonical docs:

- [SUBMISSION_ENGINE.md](./SUBMISSION_ENGINE.md)
- [EVIDENCE_MANIFEST.md](./EVIDENCE_MANIFEST.md)
- [SUBMISSION_LIFECYCLE.md](./SUBMISSION_LIFECYCLE.md)
- [SUBMISSION_SUMMARY.md](./SUBMISSION_SUMMARY.md)
- [EVIDENCE_ADAPTERS.md](./EVIDENCE_ADAPTERS.md)

## Structure

```
Submission Package (SUB-…)
  ├── Metadata + status
  ├── Execution Context snapshot
  ├── Evidence Manifest
  │     └── EvidenceItem[] → EvidenceReference (adapter)
  ├── Device / GPS / timing snapshots
  └── Submission Summary
```

## Lifecycle

`draft → ready → submitted → validating → validation_complete → in_review → approved | rejected | revision_requested → closed`

## Events

`submission.created` · `submission.updated` · `submission.submitted` · `submission.approved` · `submission.rejected` · `submission.revision_requested`
