# AI Policies

| Mode | Execute? | Auto-apply? | Human approval? |
| --- | --- | --- | --- |
| `disabled` | no | no | no |
| `recommendation_only` | yes | no | no |
| `human_approval_required` | yes | no | yes |
| `automatic` | yes | **no** (future) | yes (Sprint 15) |

Sprint 15 never silently mutates domain state — even `automatic` stays recommendation-only until a future sprint enables guarded auto-apply.

## Decision Records

When a human acts on AI advice, create a `DEC-…` record capturing:

- actor
- plugins / recommendations consulted
- final decision
- outcome: accepted | modified | rejected | deferred
- evidence references

API: `createAiDecisionRecord` / `createAiDecisionRecordAction`.
