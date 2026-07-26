# Claim Engine

Claim flow:

```
Claim → Temporary Reservation → Assignment → Confirmation
```

## Steps

1. Expire stale reservations
2. Load Work Opportunity (Task Instance + Campaign + Template)
3. Evaluate **eligibility** (constraints + scopes)
4. Evaluate **claim policies** (concurrency, cooldown, invite, org-only, …)
5. Atomically reserve inventory (`available` → `reserved`)
6. Confirm → create Assignment (`ASN-…`) and mark instance `claimed`

One-shot helper: `claimWorkOpportunity` (reserve + confirm).

## Claim Policies

Separate from eligibility. Configured on Campaign as `claimPolicies` JSON.

| Policy | Meaning |
| --- | --- |
| `one_active_per_campaign` | At most one active assignment per worker per campaign |
| `max_concurrent_assignments` | Global concurrency cap |
| `cooldown_after_completion` | Wait after last completion |
| `invite_only` | Requires invite token |
| `organization_only` | Must be org member |
| `first_come_first_served` | Default race via reservation |
| `lottery_future` / `priority_trust_future` | Deferred |

Constants: `constants/claim-policies.ts`
