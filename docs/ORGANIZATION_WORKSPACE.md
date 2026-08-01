# ZOLANZO — Organization Workspace Specification

**Date:** 2026-07-31  
**Phase:** Phase 5.4 — Organization Workspace  
**Target Quality:** White-Label Enterprise Workspace (Outperforming TaskletPay)  
**Access Scope:** Organization Members (`requireOrgPermission(...)`)  

---

## Executive Overview

The **Organization Workspace** delivers an isolated, white-labeled private platform experience for advertisers, companies, and enterprise organizations. It enables seamless campaign execution, multi-tier team delegation, financial treasury management, automated governance, and developer API control.

---

## Workspace Architecture Directory (23 Sections)

| Workspace Section | Primary Operational Focus | Key Features & Capabilities |
| --- | --- | --- |
| **1. Dashboard** | Executive spending & campaign summary | KPI cards, quick actions bar, recent activity stream |
| **2. Campaign Management** | Campaign creation & lifecycle management | Wizard creator, stage status pills, task instance allocation |
| **3. Budget** | Campaign & department budget allocation | Department caps, spending velocity meters, budget alert triggers |
| **4. Wallet** | Corporate treasury & escrow balances | Deposit funds, auto-refill triggers, transaction ledger |
| **5. Assignments** | Task claims & execution monitoring | Real-time claim status, worker progress trackers, submission queues |
| **6. Workers** | Preferred & blocked worker rosters | Private worker talent pools, trust score requirements, direct invites |
| **7. Reviews** | Submission verification & quality review | Side-by-side evidence reviewer, batch approve/reject, feedback ratings |
| **8. Analytics** | Organizational metrics & performance BI | Custom date pickers, spend breakdown by campaign, worker throughput |
| **9. Forecasts** | Predictive completion & budget models | Projected completion dates, capacity bottleneck alerts, confidence % |
| **10. Automation** | Trigger-action workflow rule engine | Auto-approve submissions under threshold, auto-reject invalid formats |
| **11. Reports** | Custom PDF, CSV & JSON report generator | Scheduled weekly spend reports, automated stakeholder email dispatch |
| **12. Invoices** | Monthly corporate invoices & receipts | VAT/Tax breakdown, downloadable PDF statements, payment status |
| **13. Billing** | Payment methods & corporate credit lines | Credit cards, Paystack bank transfers, wire transfer billing profiles |
| **14. Team Members** | Enterprise organization directory | Invite team members, role assignments, active session revokes |
| **15. Permissions** | Fine-grained RBAC permission matrix | 6 Pre-configured roles (`owner`, `admin`, `manager`, `reviewer`, etc.) |
| **16. Approvals** | Multi-tier threshold approval chains | Multi-signature sign-off for campaigns > $10,000 / wallet withdrawals |
| **17. Audit** | Organization-level security audit trail | Log of budget changes, member invites, role grants, campaign launches |
| **18. Notifications** | Org-wide notification preferences | Slack / Email / SMS alert channels for approval requests & low balance |
| **19. Settings** | Organization metadata & legal info | Tax ID, business address, timezone, currency defaults |
| **20. Integrations** | Installed marketplace connector runtime | Salesforce, HubSpot, Zapier, Slack, Google Sheets sync settings |
| **21. Developer API** | Organization API keys & OAuth apps | Scoped API key generation (`sk_org_...`), IP allowlists, usage quotas |
| **22. Webhooks** | Outbound event subscription management | Signed webhook endpoints, secret rotation, delivery retry logs |
| **23. Workspace Branding** | White-label custom branding suite | Custom logo upload, primary accent color picker, custom CNAME domain |

---

## Enterprise Feature Specifications

### 1. Fine-Grained Role Management (6 Roles)

- `org:owner`: Full operational, financial, billing, and team management authority.
- `org:admin`: Operational management, team member invites, campaign launches, and API key generation (no wallet withdrawals).
- `org:campaign_manager`: Campaign creation, budget allocation within cap, and worker roster management.
- `org:reviewer`: Task submission review, evidence inspection, and approve/reject actions.
- `org:analyst`: Read-only access to Analytics, Reports, Forecasts, and Audit logs.
- `org:developer`: Access to Developer API keys, Webhooks, and Integration settings.

### 2. Multi-Tier Threshold Approval Chains

- **Budget Threshold Rules**:
  - Campaigns ≤ $1,000: Auto-approved by Campaign Manager.
  - Campaigns $1,001 – $10,000: Requires 1 Approval (`org:admin`).
  - Campaigns > $10,000: Requires Dual Approval (`org:admin` + `org:owner`).
- **Withdrawal Rules**:
  - Wallet payouts > $5,000 require 2-step verification and `org:owner` sign-off.

### 3. White-Label Workspace Branding

- **Custom Assets**: Upload corporate SVG/PNG logos (`organization_logo`), favicon, and custom email header banners.
- **Brand Colors**: Configure custom Primary (`--z-primary`) and Secondary brand accents in workspace CSS tokens.
- **Custom Domain**: Support for CNAME routing (e.g. `tasks.acme-corp.com` → `app.zolanzo.com`).

### 4. Personalization & Usability Suite

- **Saved Filters**: Save complex multi-attribute search and filter presets (e.g. "High Priority Mobile Submissions").
- **Favorite Shortcuts**: Star key campaigns and frequent reports for 1-click sidebar navigation.
- **Quick Action Launcher**: Global workspace action bar (`Cmd+K`) for "Launch Campaign", "Invite Member", "Deposit Funds", and "Generate API Key".
- **Recent Activity Stream**: Real-time ticker showing team member actions, submission approvals, and financial transactions.
