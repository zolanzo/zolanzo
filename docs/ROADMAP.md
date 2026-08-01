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
| **3A.3** | Security hardening (RLS, webhooks, IDOR, withdrawals, ARCH-1) | ✅ [PHASE_3A3_SECURITY_REPORT.md](./PHASE_3A3_SECURITY_REPORT.md) |
| **3A.4** | Observability (metrics / tracing / Sentry / alerts) | ✅ [PHASE_3A4_OBSERVABILITY_REPORT.md](./PHASE_3A4_OBSERVABILITY_REPORT.md) |
| **3A.5** | Disaster recovery & business continuity | ✅ [PHASE_3A5_DR_REPORT.md](./PHASE_3A5_DR_REPORT.md) |
| **3A.6** | Production certification | ✅ [PRODUCTION_CERTIFICATION_REPORT.md](./PRODUCTION_CERTIFICATION_REPORT.md) — **🟢 READY FOR PHASE 3B** |
| — | RLS deploy (final pending migration) | ✅ [RLS_DEPLOYMENT_REPORT.md](./RLS_DEPLOYMENT_REPORT.md) |

### Phase 3B — Live Integrations
Fill adapters only. Domain stays provider-agnostic.

| Slice | Focus | Status |
| --- | --- | --- |
| **3B.1** | Paystack (payments, webhooks, refunds, reconcile) | ✅ [PHASE_3B1_PAYSTACK_REPORT.md](./PHASE_3B1_PAYSTACK_REPORT.md) |
| **3B.2** | Resend (email, OTPs, transactional) | ✅ [PHASE_3B2_RESEND_REPORT.md](./PHASE_3B2_RESEND_REPORT.md) |
| **3B.3** | Sendchamp (SMS/WhatsApp) | ✅ [PHASE_3B3_SENDCHAMP_REPORT.md](./PHASE_3B3_SENDCHAMP_REPORT.md) |
| **3B.4** | End-to-end business journey validation | ✅ [PHASE_3B4_E2E_CERTIFICATION.md](./PHASE_3B4_E2E_CERTIFICATION.md) — **Conditional Pilot** |
| **3B.5** | Storage, media lifecycle & file pipeline validation | ✅ [PHASE_3B5_STORAGE_REPORT.md](./PHASE_3B5_STORAGE_REPORT.md) |
| **3B.6** | Closed Pilot (25–100 users) | 🔄 [CLOSED_PILOT_REPORT.md](./CLOSED_PILOT_REPORT.md) — **GO WITH CONDITIONS** |
| **3B.7** | Public Launch | ⏳ |

**Provider wave complete:** Paystack · Resend · Sendchamp · Supabase Storage.

**RC1 freeze:** [RC1_GOVERNANCE.md](./RC1_GOVERNANCE.md) — feature + schema freeze on `release/1.0`. Bug/security/reliability/docs only. Re-validate via `journeys/`.

**Pilot ops:** [CLOSED_PILOT_PROGRAM.md](./CLOSED_PILOT_PROGRAM.md) · [CLOSED_PILOT_DAILY_CHECKLIST.md](./CLOSED_PILOT_DAILY_CHECKLIST.md)

**3B.1 note:** Live Paystack HTTP activates only when `PAYSTACK_SECRET_KEY` is set. Configure webhook `{APP}/api/webhooks/paystack` and callback `{APP}/api/payments/callback` after keys land.

**3B.2 note:** Live Resend activates only when `RESEND_API_KEY` is set. Configure webhook `{APP}/api/webhooks/resend` + `RESEND_WEBHOOK_SECRET` after keys land.

**3B.3 note:** Live Sendchamp activates only when `SENDCHAMP_API_KEY` is set. Configure webhook `{APP}/api/webhooks/sendchamp` + `SENDCHAMP_WEBHOOK_SECRET` (and `SENDCHAMP_WHATSAPP_SENDER` for WhatsApp) after keys land.

**3B.4 note:** Path-contract certification complete. Staging live sessions + provider keys required before expanding pilot. Product listings and bank rails remain out of critical path.

**3B.5 note:** Live Supabase Storage when `STORAGE_PROVIDER=supabase` + service role. Create buckets per [STORAGE_BUCKET_POLICIES.md](./STORAGE_BUCKET_POLICIES.md).

**3B.6 note:** Program prepared. Clear environment gate (keys, buckets, webhooks, cron, monitoring) before canary invites (5–10), then 25–100.

### Phase 3C — Product Experience
Worker / client / reviewer / finance / admin UX on existing APIs.

### Phase 3D — Native Apps
Same APIs; offline, push, uploads — no mobile-specific business logic.

### Phase 3E — Enterprise
SSO, SCIM, API keys, webhooks, analytics (premium capabilities).

---

## Phase 4 — Intelligent Work Platform (V2)

Phase 3 proved the platform works. Phase 4 makes it exceptional — every slice must raise revenue, cut ops cost, improve trust, or win competitive choice. No AI for AI’s sake.

| Slice | Focus | Status |
| --- | --- | --- |
| **4.1A** | AI Intelligence Foundation (adapters, knowledge, health) | ✅ [PHASE_4_1A_AI_FOUNDATION.md](./PHASE_4_1A_AI_FOUNDATION.md) |
| **4.1B** | AI Match Engine (worker ranking) | ✅ [PHASE_4_1B_AI_MATCH_ENGINE.md](./PHASE_4_1B_AI_MATCH_ENGINE.md) |
| **4.1C** | AI Fraud Detection | ✅ [PHASE_4_1C_AI_FRAUD_DETECTION.md](./PHASE_4_1C_AI_FRAUD_DETECTION.md) |
| **4.1D** | AI Review Assistant | ✅ [PHASE_4_1D_AI_REVIEW_ASSISTANT.md](./PHASE_4_1D_AI_REVIEW_ASSISTANT.md) |
| **4.1E** | Organization Copilot | ✅ [PHASE_4_1E_ORGANIZATION_COPILOT.md](./PHASE_4_1E_ORGANIZATION_COPILOT.md) |
| **4.1F** | Worker Copilot | ✅ [PHASE_4_1F_WORKER_COPILOT.md](./PHASE_4_1F_WORKER_COPILOT.md) |
| **4.2A** | Trust & Reputation Foundation | ✅ [PHASE_4_2A_TRUST_FOUNDATION.md](./PHASE_4_2A_TRUST_FOUNDATION.md) |
| **4.2B** | Trust Persistence & Event Integration | ✅ [PHASE_4_2B_TRUST_PERSISTENCE.md](./PHASE_4_2B_TRUST_PERSISTENCE.md) |
| **4.2C** | Trust Passport | ✅ [PHASE_4_2C_TRUST_PASSPORT.md](./PHASE_4_2C_TRUST_PASSPORT.md) |
| **4.3A** | Analytics Foundation | ✅ [PHASE_4_3A_ANALYTICS_FOUNDATION.md](./PHASE_4_3A_ANALYTICS_FOUNDATION.md) |
| **4.3B** | Executive Dashboards | ✅ [PHASE_4_3B_EXECUTIVE_DASHBOARDS.md](./PHASE_4_3B_EXECUTIVE_DASHBOARDS.md) |
| **4.3C** | Forecasting & Decision Intelligence | ✅ [PHASE_4_3C_FORECASTING.md](./PHASE_4_3C_FORECASTING.md) |
| **4.3D** | Scheduled Reports & Data Exports | ✅ [PHASE_4_3D_REPORTS_AND_EXPORTS.md](./PHASE_4_3D_REPORTS_AND_EXPORTS.md) |
| **4.4A** | Workflow Automation Foundation | ✅ [PHASE_4_4A_WORKFLOW_AUTOMATION_FOUNDATION.md](./PHASE_4_4A_WORKFLOW_AUTOMATION_FOUNDATION.md) |
| **4.4B** | Automation Library | ✅ [PHASE_4_4B_AUTOMATION_LIBRARY.md](./PHASE_4_4B_AUTOMATION_LIBRARY.md) |
| **4.4C** | Visual Rule Builder | ✅ [PHASE_4_4C_VISUAL_RULE_BUILDER.md](./PHASE_4_4C_VISUAL_RULE_BUILDER.md) |
| **4.4D** | Automation Governance | ✅ [PHASE_4_4D_AUTOMATION_GOVERNANCE.md](./PHASE_4_4D_AUTOMATION_GOVERNANCE.md) |
| **4.5** | Public API Platform | ✅ |
| **4.5A** | Public API Platform (v1 contract) | ✅ [PHASE_4_5A_PUBLIC_API_PLATFORM.md](./PHASE_4_5A_PUBLIC_API_PLATFORM.md) |
| **4.5B** | Webhooks & Event Subscriptions | ✅ [PHASE_4_5B_WEBHOOKS.md](./PHASE_4_5B_WEBHOOKS.md) |
| **4.5C** | Integration Marketplace | ✅ [PHASE_4_5C_INTEGRATION_MARKETPLACE.md](./PHASE_4_5C_INTEGRATION_MARKETPLACE.md) |
| **4.5D** | SDKs & Developer Portal | ✅ [PHASE_4_5D_DEVELOPER_PORTAL.md](./PHASE_4_5D_DEVELOPER_PORTAL.md) |
| **4.6** | Mobile & Offline | ⏳ |
| **4.7** | Enterprise Features | ⏳ |
| **4.8** | Growth Engine | ⏳ |
| **4.9** | AI Marketplace | ⏳ |
| **4.10** | Production Launch | ⏳ |

**4.1A note:** Package lives at `lib/ai/` (maps from task `src/ai/`). Live OpenAI only when `AI_ENABLED=1` + `AI_PROVIDER=openai` + `OPENAI_API_KEY`.

**4.1B note:** `RankingEngine` recommends top workers (never assigns). Rule score always works; AI confidence augments when `AI_ENABLED`. Flags: `AI_MATCH_ENGINE`, `AI_EXPLAINABILITY`, `AI_FAIRNESS`.

**4.1C note:** `FraudDetector` assesses submission risk (never approves/rejects). Rule engine always runs; AI enricher optional. Flags: `AI_FRAUD_DETECTION`, `AI_FRAUD_EXPLAINABILITY`, `AI_DUPLICATE_ANALYSIS`, `AI_GEO_ANALYSIS`.

**4.1D note:** `ReviewAssistant` summarizes submissions for reviewers (never decides). Consumes fraud + campaign rules + evidence checklist. Flags: `AI_REVIEW_ASSISTANT`, `AI_REVIEW_SUMMARIES`, `AI_REVIEW_FEEDBACK`.

**4.1E note:** `OrganizationCopilot` answers org questions (never acts). Session memory + permission filters. Flags: `AI_ORG_COPILOT`, `AI_ORG_MEMORY`, `AI_ORG_RECOMMENDATIONS`.

**4.1F note:** `WorkerCopilot` guides workers (never acts). Self-only retrieval + assignment/progress coaches. Flags: `AI_WORKER_COPILOT`, `AI_WORKER_MEMORY`, `AI_WORKER_RECOMMENDATIONS`. **Phase 4.1 (AI Intelligence Engine) complete.**

**4.2A note:** `lib/trust/` is the shared Trust Engine (dimensions, decay, trends, explanations). Flags: `TRUST_ENGINE`, `TRUST_EXPLAINABILITY`, `TRUST_TRENDS`. Match/Worker Copilot consume `resolveOverallTrustScore`.

**4.2B note:** Persistent `TrustProfile` / `TrustEvent` / history. Domains emit via `safeRecordTrustEvent`. Match/Copilots prefer persisted scores. See [PHASE_4_2B_TRUST_PERSISTENCE.md](./PHASE_4_2B_TRUST_PERSISTENCE.md).

**4.2C note:** Trust Passport presents TrustProfile as private/org/public views (badges, achievements, guidance, timeline). Never recalculates trust. Flags: `TRUST_PASSPORT`, `TRUST_BADGES`, `TRUST_TIMELINE`. **Phase 4.2 Trust & Reputation complete.**

**4.3A note:** Unified analytics event pipeline (`lib/analytics/`). Domains emit via `safeRecordAnalyticsEvent`. Rollups, snapshots, reports — no dashboards yet. Flags: `ANALYTICS_ENGINE`, `ANALYTICS_SNAPSHOTS`, `ANALYTICS_REPORTS`.

**4.3B note:** Executive dashboards present AnalyticsService (+ Trust/AI APIs) via WidgetRegistry. No metric computation or writes. Flags: `ANALYTICS_DASHBOARDS`, `EXECUTIVE_DASHBOARD`, `OPERATIONS_DASHBOARD`.

**4.3C note:** Forecast Engine produces advisory predictions + recommendations (`advisoryOnly`). Consumes Analytics / Trust / AI telemetry only. Flags: `FORECAST_ENGINE`, `FORECAST_RECOMMENDATIONS`, `FORECAST_MODELS`.

**4.3D note:** Scheduled reports & exports (PDF/CSV/XLSX/JSON) from Analytics/Trust/Forecast/Dashboards. Flags: `REPORTS_ENGINE`, `REPORT_EXPORTS`, `REPORT_SCHEDULES`. **Phase 4.3 Business Intelligence complete.**

**4.4A note:** Workflow Automation Engine reacts to domain events and invokes existing services only (no domain DB bypass). Flags: `AUTOMATION_ENGINE`, `AUTOMATION_RULES`, `AUTOMATION_ACTIONS`.

**4.4B note:** Automation Library ships curated templates that generate standard rules via `AutomationService` only. Flags: `AUTOMATION_LIBRARY`, `AUTOMATION_TEMPLATES`.

**4.4C note:** Visual Rule Builder authors validated rules (preview + dry-run simulation + JSON I/O). Execution stays in AutomationService. Flags: `AUTOMATION_BUILDER`, `AUTOMATION_SIMULATION`, `AUTOMATION_IMPORT_EXPORT`.

**4.4D note:** Automation Governance manages lifecycle, approvals, immutable versions, rollback, policies, and audit. Engine executes published rules only. Flags: `AUTOMATION_GOVERNANCE`, `AUTOMATION_APPROVALS`, `AUTOMATION_AUDIT`. **Phase 4.4 Workflow Automation complete.**

**4.5A note:** Public API `/api/v1` is the external contract layer (API keys, OAuth foundation, scopes, rate limits, idempotency, OpenAPI). Flags: `PUBLIC_API`, `PUBLIC_API_V1`, `PUBLIC_OPENAPI`, `PUBLIC_RATE_LIMITING`.

**4.5B note:** Outbound webhooks consume committed platform events (HMAC, retry, DLQ, replay). Flags: `PUBLIC_WEBHOOKS`, `WEBHOOK_DELIVERY`, `WEBHOOK_REPLAY`.

**4.5C note:** Integration Marketplace connectors use Public API + Webhooks only (never internal services). Flags: `INTEGRATION_MARKETPLACE`, `CONNECTOR_RUNTIME`, `CONNECTOR_HEALTH`.

**4.5D note:** Developer Portal + OpenAPI-generated SDKs + API Explorer (dry-run). Flags: `DEVELOPER_PORTAL`, `SDK_GENERATION`, `API_EXPLORER`. **Phase 4.5 Public API Platform complete.** Next: **4.6 Mobile & Offline**.

## Cross-cutting (every sprint)

- Public IDs via `lib/public-id` only  
- Adapter ports for Passport / Sendchamp / payments / AI  
- Implementation Report at sprint end  
- Auth remains independent of business modules  
- AI remains advisory — domain services own writes  

## Explicit non-goals (near term)
- Empty dashboard shells before work kernel  
- Cloning TaskletPay IA  
- Local KYC engine (use Passport)  
- Calling vendors outside adapters  
- AI mutating wallets, reviews, or assignments directly  
