# Work Engine

> Step 5 — kernel blueprint. No UI · no DB · no business logic.

## Mission

One universal pipeline powers every kind of human work on ZOLANZO.

Workers never work on a **Campaign**.  
They work on an **Assignment** (exactly one worker ↔ one task).

## Universal pipeline

```
Client
  → Campaign
  → Task Template
  → Task
  → Marketplace
  → Worker Claim
  → Assignment
  → Submission
  → Validation
  → Review
  → Approval
  → Escrow
  → Wallet
  → Analytics
  → Completion
```

Encoded as `WORK_ENGINE_PIPELINE` in `types/work-engine.ts`.

## Object definitions

| Object | Meaning |
| --- | --- |
| **Campaign** | Client/org demand: budget, targeting, volume, `typeId` + `templateId` |
| **Task Template** | HOW work is done — ordered **capabilities** |
| **Task** | One claimable unit generated from a campaign (N tasks per campaign) |
| **Assignment** | Binding of one worker to one task + SLA/device/GPS/attempts |
| **Submission** | Evidence package for an assignment |
| **Validation** | AI / automatic / manual / hybrid checks |
| **Review** | Human decision: approve / reject / revise / escalate |
| **Escrow** | Funds reserved → released / refunded / partial |
| **Completion** | Terminal success record + analytics emission |

## Capabilities (strategic advantage)

Templates are **not** hundreds of hardcoded types.  
They are compositions of reusable capabilities (`opens_url`, `downloads_app`, `captures_gps`, `labels_image`, …).

| Template | Capabilities (example) |
| --- | --- |
| Google Play App Test | downloads_app → opens_app → creates_account → runs_test → captures_screenshot → submits_text |
| Property Verification | captures_gps → verifies_location → uploads_photo → uploads_video → submits_text |
| Instagram Follow | opens_url → follows_profile → captures_screenshot |

Sources:

- `constants/work-capabilities.ts`
- `constants/task-templates.ts`

## Two capability layers (do not confuse)

| Layer | File | Purpose |
| --- | --- | --- |
| **Work Capabilities** | `work-capabilities.ts` | Compositional steps inside templates |
| **Platform Requirements** | `campaign-types.ts` → `CampaignCapability` | Gates: KYC, escrow, geo, device |

## Scale examples (same engine)

| Ask | Campaign units | Assignments |
| --- | --- | --- |
| Download Android app × 50,000 | 50,000 Tasks | ≤ 50,000 Assignments |
| Label 20,000 images | 20,000 Tasks | ≤ 20,000 Assignments |
| Mystery shops / voice / translation | Same kernel | Same kernel |

## Feature module responsibilities

| Module | Kernel role |
| --- | --- |
| `clients` | Demand actor |
| `campaigns` | Campaign aggregate |
| `task-templates` | Template registry UX/admin later |
| `tasks` | Task generation & inventory |
| `task-marketplace` | Discovery & claim |
| `assignments` | Execution binding |
| `submissions` | Evidence |
| `verification` | Validation + review |
| `escrow` | Holds & releases |
| `wallet` | Credits |
| `analytics` | Completion metrics |

## Related docs

- [WORKFLOW.md](./WORKFLOW.md)
- [TASK_TEMPLATE_SYSTEM.md](./TASK_TEMPLATE_SYSTEM.md)
- [ASSIGNMENT_MODEL.md](./ASSIGNMENT_MODEL.md)
- [SUBMISSION_MODEL.md](./SUBMISSION_MODEL.md)
- [VALIDATION_PIPELINE.md](./VALIDATION_PIPELINE.md)
- [WORK_ENGINE_REPORT.md](./WORK_ENGINE_REPORT.md)
