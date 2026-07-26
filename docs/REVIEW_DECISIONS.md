# Review Decisions

Immutable decision records (`REV-…`).

Fields:

- Reviewer (null for automatic)
- Review mode (`automatic` · `human` · …)
- Outcome
- Confidence / duration
- Linked Validation Report + Queue Item
- Findings[]
- Comments / requested revisions
- Policy snapshot
- Audit metadata

Outcomes:

- `approved`
- `approved_with_warning`
- `revision_requested`
- `rejected`
- `escalated`
- `deferred`

A submission may accumulate multiple decisions over time (revisions, appeals).
