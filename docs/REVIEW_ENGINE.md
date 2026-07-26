# Review Engine

Reviews consume immutable **Validation Reports** and produce immutable **Review Decisions** (`REV-…`).

```
Validation Report
  → Review Policy (how to decide)
  → Review Queue
  → Reviewer Workspace
  → Decision Engine + Findings
  → Submission / Assignment updated
```

Module: `features/verification` (validation + review)

Validation answers: *Is the submission technically compliant?*  
Review Policy answers: *What decision process must this submission go through?*
