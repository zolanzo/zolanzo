# Domain Model

Conceptual model for the workforce marketplace. Prisma schemas land in a later step.

## Ubiquitous language

| Term | Meaning |
| --- | --- |
| **Campaign** | Client/org request for human work (`typeId` + `templateId`) |
| **Task Template** | HOW work is done — ordered Work Capabilities |
| **Task** | One claimable unit inside a campaign |
| **Assignment** | **One worker ↔ one task** (execution unit) |
| **Submission** | Deliverable / proof for an assignment |
| **Validation** | AI / automatic / manual / hybrid checks |
| **Review** | Human approve / reject / revise / escalate |
| **Escrow** | Funds locked until approval outcomes |
| **Wallet** | Ledger of balances and entries |
| **Marketplace** | Discovery surface over open tasks |

## Aggregates (planned)

1. **Organization** — tenant boundary  
2. **Campaign** — includes typeId, budget, targeting, status  
3. **Task** — inventory unit  
4. **Assignment** — worker commitment + SLA  
5. **Submission** — proofs + schema payload  
6. **Wallet** — balances + ledger entries  
7. **Dispute** — contested money/work  

## Relationships

```
User ──participates as──► WorkerProfile
  │                    └► ClientProfile
  │
  ├── member of ──► Organization ── has ──► Team / Workspace
  │                      │
  │                      └── owns ──► Campaign ── typeId ──► CampaignTypeRegistry
  │                                      │         templateId ──► TaskTemplate (capabilities[])
  │                                      │
  │                                      └── has many ──► Task
  │                                                        │
  │                         Application ───────────────────┤
  │                                                        │
  │                         Assignment (1 Worker + 1 Task) ◄┘
  │                                │
  │                                └── Submission ──► Validation ──► Review
  │                                                      │
  │                                                      ▼
  └── owns ──► Wallet ◄──── Escrow release / rewards / withdrawals
```

## Work capabilities & templates

- Work Capabilities: `constants/work-capabilities.ts`
- Task Templates: `constants/task-templates.ts`
- States: `constants/work-states.ts`
- Models: `types/work-engine.ts`
- Docs: `docs/WORK_ENGINE.md`

## Campaign type extensibility

`constants/campaign-types.ts` defines:

- `CampaignTypeDefinition` (id, category, capabilities, validatorKey, verificationStrategy, featureFlag, status)
- `registerCampaignType()` for future plugins
- Capability flags (`requires_microphone`, `geo_restricted`, …)

**Examples → same architecture:**

| Business ask | Type id |
| --- | --- |
| Test Android app on Samsung | `app_testing` (+ device targeting metadata) |
| Label 20,000 AI images | `image_labeling` |
| Translate PDF to Swahili | `translation` |
| Verify business listings | `custom_human_task` or `data_entry` |
| Call 300 leads | `custom_human_task` |
| Mystery shop + photos | `mystery_shopping` |
| UX review Loom video | `custom_human_task` / `website_testing` |
| Speak training sentences | `voice_recording` |

## Money model (planned)

- **Ledger is source of truth** (double-entry) — see `docs/FINANCIAL_ARCHITECTURE.md`
- Flow: Campaign → Escrow → Ledger → Wallet → Withdrawal → Settlement
- Wallets are projections (Balance, Pending, Escrow, Lifetime, Available for Withdrawal)
- Minor units + ISO currency codes; multi-currency/FX later
- Never destructive financial ops — reverse via new journals

## Multi-tenancy

- Row-level `organization_id` on tenant data  
- Super Admin cross-tenant  
- White-label: org branding config (flag-gated)

## Shared IDs

Branded string IDs in `types/domain.ts`: `UserId`, `OrganizationId`, `CampaignId`, `TaskId`, `AssignmentId`, `SubmissionId`, `WalletId`, …
