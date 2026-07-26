# Review Policies

Separate from Validation Profiles.

| Key | Behavior |
| --- | --- |
| `auto_approve_high_score` | Auto-approve when score ≥ threshold and no failures |
| `always_human` | Always enqueue human review |
| `random_audit` | Auto-approve most; sample % for human |
| `two_reviewers` | Require two independent reviewers (queue mode) |
| `senior_after_rejection` | Human first; senior path after rejection |
| `customer_before_approval` | Defer for customer confirmation |
| `escalate_high_value` | Escalate when reward ≥ threshold |

Catalog: `constants/review-policies.ts`  
DB seed: `review_policies`

Each policy declares `downstreamActions` (escrow/wallet/notify) for future wiring.
