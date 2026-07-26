# Approval Workflow

Modes:

- **Automatic** — confirm → approved (or scheduled)
- **Manual** — confirm → `pending_approval`
- **Threshold** — amount ≥ threshold → manual

Approvals are immutable rows (`WithdrawalApproval`) with decision, step, comments.

**Approval never posts ledger entries.** Money moves only on completion.
