# Work Engine Workflow

## Happy path

```
1. Client creates Campaign (templateId + targetUnits + reward)
2. Payment funds escrow → campaign.funded / escrow.reserved
3. Campaign published → Task Instances generated × N (strategy + policy)
4. Instances available on Marketplace → task.available
5. Worker claims → reservation (2m) → assignment.claimed (`ASN-…`) + task.claimed
6. Worker starts → assignment.started
7. Worker submits evidence → submission.submitted
8. Validation runs → validation.completed (or failed → revision)
9. Review (if required) → review.approved
10. Escrow release → escrow.released → wallet.released / wallet.credited
11. work.completed → analytics.work_unit_completed
12. Assignment → completed
```

## Sequence (markdown)

```
Client          Campaign         Tasks        Marketplace      Worker         Validation/Review     Escrow/Wallet
  |                |               |               |              |                   |                  |
  |--create------->|               |               |              |                   |                  |
  |--fund--------->|               |               |              |                   |                  |
  |                |--generate---->|               |              |                   |                  |
  |                |               |--list-------->|              |                   |                  |
  |                |               |               |<---claim-----|                   |                  |
  |                |               |               |              |--submit---------->|                  |
  |                |               |               |              |                   |--release-------->|
  |                |               |               |              |<--paid--------------------------------|
```

## State machines

See `constants/work-states.ts`.

### Campaign
`draft → pending_review → scheduled ⇄ active ⇄ paused → completed | cancelled → archived`

### Task Instance
`generated → available ⇄ reserved → claimed → completed`  
(+ `expired` | `cancelled`)

### Assignment
`claimed → started → submitted → under_validation → under_review → approved → completed`  
Branches: `revision_requested`, `rejected`, `escalated`, `expired`, `cancelled`

### Submission
`draft → ready → submitted → validating → validation_complete → in_review → approved | rejected | revision_requested → closed`

### Escrow
`reserved → held → released | refunded | partially_released`

## Failure paths

| Failure | Result |
| --- | --- |
| Validation fail | revision_requested or rejected |
| Review reject | escrow.refunded (policy) / no wallet credit |
| Expiry | assignment.expired · task may reopen (policy) |
| Dispute | hold escrow · trust events |

## Events (kernel)

`campaign.created` · `campaign.funded` · `task.generated` · `assignment.claimed` · `submission.created` · `validation.completed` · `review.approved` · `escrow.released` · `wallet.released` · `work.completed`
