# Roadmap

Architecture Phase **closed** (94/100). Sprint 1 **complete** (96.5/100).

## ✅ Completed

| Area | Status |
| --- | --- |
| Foundation · Design System · Architecture | ✅ |
| Identity · Finance · Infrastructure (blueprints) | ✅ |
| Platform Core · Authentication · Organizations · RBAC · Sessions | ✅ |
| Public ID generator (pre–Sprint 2) | ✅ |

Reports: [SPRINT_1_PART1](./SPRINT_1_PART1_REPORT.md) · [SPRINT_1_PART2](./SPRINT_1_PART2_REPORT.md) · [PUBLIC_IDS](./PUBLIC_IDS.md)

---

## Implementation order (Work Kernel first)

Dashboards come **after** the work domain produces real data.

### Sprint 2 — Task Template Engine ✅
Defines *how* work is performed (capabilities, constraints, evidence, validation, review, rewards, versioning).  
Report: [SPRINT_2_TASK_TEMPLATE_REPORT.md](./SPRINT_2_TASK_TEMPLATE_REPORT.md) · [TASK_TEMPLATE_ENGINE.md](./TASK_TEMPLATE_ENGINE.md)

### Sprint 3 — Campaign Engine ✅
Business contracts (`CMP-…`) consuming Task Templates + generation strategy metadata + Campaign Brief.  
Report: [SPRINT_3_CAMPAIGN_ENGINE_REPORT.md](./SPRINT_3_CAMPAIGN_ENGINE_REPORT.md) · [CAMPAIGN_ENGINE.md](./CAMPAIGN_ENGINE.md)

### Sprint 4 — Task Instance Generator ✅
Campaigns emit immutable Task Instances (`TSK-…`) via strategy + policy. Assignments come on claim later.  
Report: [SPRINT_4_TASK_INSTANCE_REPORT.md](./SPRINT_4_TASK_INSTANCE_REPORT.md) · [TASK_INSTANCE_ENGINE.md](./TASK_INSTANCE_ENGINE.md)

### Sprint 5 — Marketplace & Claim Engine ✅
Work Opportunities, eligibility, claim policies, reservations, Assignments (`ASN-…`).  
Report: [SPRINT_5_MARKETPLACE_REPORT.md](./SPRINT_5_MARKETPLACE_REPORT.md) · [MARKETPLACE.md](./MARKETPLACE.md)

### Sprint 6 — Assignment Workspace & Execution Engine ✅
Assignments become worker workspaces with execution steps, checklist, progress, timeline, and immutable Execution Context.  
Report: [SPRINT_6_ASSIGNMENT_WORKSPACE_REPORT.md](./SPRINT_6_ASSIGNMENT_WORKSPACE_REPORT.md) · [ASSIGNMENT_WORKSPACE.md](./ASSIGNMENT_WORKSPACE.md)

### Sprint 7 — Submission Package & Evidence Engine ✅
Immutable Submission Packages with Evidence Manifests + storage adapters (`SUB-…`).  
Report: [SPRINT_7_SUBMISSION_REPORT.md](./SPRINT_7_SUBMISSION_REPORT.md) · [SUBMISSION_ENGINE.md](./SUBMISSION_ENGINE.md)

### Sprint 8 — Validation Engine ✅
Composable validator pipeline, profiles, evidence snapshots, immutable reports (`VAL-…`).  
Report: [SPRINT_8_VALIDATION_REPORT.md](./SPRINT_8_VALIDATION_REPORT.md) · [VALIDATION_ENGINE.md](./VALIDATION_ENGINE.md)

### Sprint 9 — Review Engine ✅
Decision engine with queue, findings, policies, immutable decisions (`REV-…`).  
Report: [SPRINT_9_REVIEW_REPORT.md](./SPRINT_9_REVIEW_REPORT.md) · [REVIEW_ENGINE.md](./REVIEW_ENGINE.md)

### Sprint 10 — Settlement, Escrow & Ledger Engine ✅
Ledger source of truth, escrow snapshots, settlements (`SET-…` / `BAT-…` / `TXN-…` / `WAL-…`).  
Report: [SPRINT_10_SETTLEMENT_REPORT.md](./SPRINT_10_SETTLEMENT_REPORT.md) · [SETTLEMENT_ENGINE.md](./SETTLEMENT_ENGINE.md)

---

## Financial Completion & Integration Layer

### Sprint 11 — Withdrawal Engine ✅
Intent → eligibility → reservation → `WDR-…` → approval → ledger → `BATW-…` (wallets never mutated).  
Report: [SPRINT_11_WITHDRAWAL_REPORT.md](./SPRINT_11_WITHDRAWAL_REPORT.md) · [WITHDRAWAL_ENGINE.md](./WITHDRAWAL_ENGINE.md)

### Sprint 12 — Payment Platform & Provider Adapters ✅
Provider-agnostic `PAY-…` intents, capability-based adapters (stubs), webhooks → ledger funding.  
Report: [SPRINT_12_PAYMENT_REPORT.md](./SPRINT_12_PAYMENT_REPORT.md) · [PAYMENT_PLATFORM.md](./PAYMENT_PLATFORM.md)

### Sprint 13 — Notification Hub ✅
Intent (`NTF-…`) → preferences/policies/templates → jobs → channel adapters (Memory delivers; others stub).  
Report: [SPRINT_13_NOTIFICATION_REPORT.md](./SPRINT_13_NOTIFICATION_REPORT.md) · [NOTIFICATION_HUB.md](./NOTIFICATION_HUB.md)

### Sprint 14 — Admin & Operations Console ✅
Command Center, Operational Views, queues, auditable Operation Commands (`OPC-…`), playbooks, ops RBAC.  
Report: [SPRINT_14_OPERATIONS_REPORT.md](./SPRINT_14_OPERATIONS_REPORT.md) · [OPERATIONS_CONSOLE.md](./OPERATIONS_CONSOLE.md)

### Sprint 15 — AI Plugin Platform ✅
Capability-based plugins, immutable AI Context, structured recommendations (`AIX-…`), Decision Records (`DEC-…`).  
Report: [SPRINT_15_AI_REPORT.md](./SPRINT_15_AI_REPORT.md) · [AI_PLATFORM.md](./AI_PLATFORM.md)

---

## Phase 2 complete

Domain · Finance · Payments · Notifications · Operations · AI plugins — foundations closed.

## Phase 3 — Prove it in production (workstreams)

Do **not** invent new domain concepts. Sequence:

### Phase 3A — Production Readiness (current)
Architecture conformance · security · observability · DR.  
Baseline: [PHASE_3A_PRODUCTION_READINESS_AUDIT.md](./PHASE_3A_PRODUCTION_READINESS_AUDIT.md) (**~47%** readiness; architecture ~**91%**).

| Sprint | Focus | Status |
| --- | --- | --- |
| **3A.1** | Request lifecycle & correlation | ✅ [PHASE_3A1_CORRELATION_REPORT.md](./PHASE_3A1_CORRELATION_REPORT.md) |
| **3A.2** | Reliability (cron, readiness, retries) | ✅ [PHASE_3A2_RELIABILITY_REPORT.md](./PHASE_3A2_RELIABILITY_REPORT.md) |
| 3A.3 | Observability (metrics / alerting) | Next |
| 3A.4 | Disaster recovery | Pending |
| 3A.5 | Production certification | Pending |

### Phase 3B — Live Integrations
Fill adapters only (Paystack → Sendchamp → Resend → FCM → storage → …). No domain changes.

### Phase 3C — Product Experience
Worker / client / reviewer / finance / admin UX on existing APIs.

### Phase 3D — Native Apps
Same APIs; offline, push, uploads — no mobile-specific business logic.

### Phase 3E — Enterprise
SSO, SCIM, API keys, webhooks, analytics (premium capabilities).

## Cross-cutting (every sprint)

- Public IDs via `lib/public-id` only  
- Adapter ports for Passport / Sendchamp / payments  
- Implementation Report at sprint end  
- Auth remains independent of business modules  

## Explicit non-goals (near term)
- Empty dashboard shells before work kernel  
- Cloning TaskletPay IA  
- Local KYC engine (use Passport)  
- Calling vendors outside adapters  
