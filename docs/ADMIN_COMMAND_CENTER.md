# ZOLANZO — Enterprise Command Center Specification

**Date:** 2026-07-31  
**Phase:** Phase 5.3 — Enterprise Command Center  
**Target Quality:** Executive Enterprise Operations Center  
**Access Scope:** Admin / Ops Staff (`requirePermission("admin:access")`)  

---

## Executive Overview

The **Enterprise Command Center** serves as ZOLANZO's mission control operations platform. It provides real-time infrastructure visibility, financial ledger auditing, workforce management, security threat mitigation, and automated incident triage across 18 specialized operational modules.

---

## Operations Module Directory (18 Modules)

| Module Name | Core Operational Mission | Live Status Indicators | Primary Bulk Actions |
| --- | --- | --- | --- |
| **1. Executive Dashboard** | High-level platform health & KPI summary | Operational / Degraded / Outage | Export PDF Report |
| **2. System Health** | DB, Storage, API, Webhook, Payment probes | 13 Active Service Probes | Trigger Health Smoke Test |
| **3. Revenue** | Escrow balances, fee margins, ledger integrity | Daily Volume & Fee Margin | Export Accounting Ledger |
| **4. Organizations** | Org directory, verification & tier management | Org Active Status & Risk Tier | Batch Verify / Suspend Orgs |
| **5. Workers** | Worker directory, Trust score & KYC status | Active Worker Session Counts | Batch Verify / Freeze Workers |
| **6. Campaigns** | Campaign lifecycle & task distribution | Live Active Campaign Count | Batch Pause / Terminate |
| **7. Payments** | Paystack webhooks, disbursements & payouts | Gateway Success & Failure Rates | Batch Retry Pending Payouts |
| **8. Trust** | Platform trust score distribution & anomalies | Trust Index (0–100) Average | Trigger System-wide Recalc |
| **9. Analytics** | Event ingestion, rollups & metrics pipeline | Event Ingestion QPS | Rebuild Daily Metrics Rollup |
| **10. Forecasts** | Predictive capacity & confidence monitoring | Model Accuracy & Confidence % | Retrain Advisory Models |
| **11. Automation** | Rule execution, matching & action dispatch | Rules Active & Matched / Min | Toggle Rules / Flush Log |
| **12. Webhooks** | Outbound delivery queues & DLQ management | Outbound Delivery Latency (ms) | Replay DLQ Deliveries |
| **13. Integrations** | Third-party connector marketplace runtime | Installed Connectors Sync Rate | Force Connector Sync |
| **14. Audit Logs** | Immutable system-wide audit trail viewer | Audit Event Ingestion Rate | Export CSV Security Log |
| **15. Security** | Rate limits, IP blocks & CSRF / SSRF alerts | Active IP Blocks & Threat Level | Block IP / Revoke Keys |
| **16. Feature Flags** | Dynamic feature flag toggles & rollout gates | Active Feature Gate Count | Toggle Flag / Update % |
| **17. Support** | Customer & worker support ticket triage | Open Support Ticket Queue | Batch Assign / Resolve |
| **18. Incidents** | Outage response, status page & playbooks | Incident Status (P1/P2/P3/P4) | Declare / Resolve Incident |

---

## Module Specifications & Operational Capabilities

### 1. Executive Dashboard
- **KPI Metrics**: Monthly Recurring Volume (MRV), Active Campaigns, Active Workers, System Readiness (0–100).
- **Charts**: 24-hour transaction volume trend (area chart), API request throughput (bar chart).
- **Live Status**: Real-time platform status banner (`All Systems Operational`).

### 2. System Health
- **KPI Metrics**: DB Latency (ms), Public API p95 (ms), Storage Bucket Response (ms), Webhook Queue Size.
- **Table**: 13 infrastructure probes displaying Status (`pass`/`warn`/`fail`/`blocked`), Latency, Last Checked timestamp, and Error evidence.
- **Bulk Action**: Run full automated production verification suite (`npm run verify:production`).

### 3. Revenue & Ledger
- **KPI Metrics**: Total Gross Volume (GMV), Platform Revenue (Fees), Escrow Balance, Unsettled Transactions.
- **Charts**: Daily fee margin distribution, escrow deposit vs payout volume comparison.
- **Table**: Financial transaction ledger with filters for Organization, Status (`escrow_locked`, `released`, `refunded`), and Date range.

### 4. Organizations
- **KPI Metrics**: Total Organizations, Verified Orgs, Pending KYC, High-Volume Enterprise Orgs.
- **Search & Filters**: Instant search by Org Name or ID; filter by Verification Tier (`starter`, `verified`, `enterprise`).
- **Bulk Actions**: Batch Verify Orgs, Batch Update Fee Tiers, Batch Suspend Org Access.

### 5. Workers
- **KPI Metrics**: Total Registered Workers, Average Trust Score, Active Workers (24h), KYC Approved.
- **Search & Filters**: Search by Worker Email or Public ID; filter by Trust Tier (`bronze`, `silver`, `gold`, `platinum`).
- **Bulk Actions**: Batch Recalculate Trust Scores, Batch Verify Identity, Freeze Suspicious Workers.

### 6. Campaigns
- **KPI Metrics**: Live Campaigns, Draft Campaigns, Completed Campaigns, Total Budget Escrowed.
- **Table**: Campaign directory displaying Org Owner, Target Tasks, Completed %, Budget, and Expiry date.
- **Bulk Actions**: Batch Pause Campaigns, Force Expire Expired Campaigns.

### 7. Payments & Disbursements
- **KPI Metrics**: Paystack Processing Success %, Total Payouts Disbursed, Pending Withdrawals, Failed Transactions.
- **Table**: Payment attempts log with Webhook event signatures and transaction reference IDs.
- **Bulk Actions**: Batch Retry Failed Paystack Payouts, Batch Approve Pending Withdrawals.

### 8. Trust Engine
- **KPI Metrics**: Platform Average Trust Score, Trust Anomaly Count, Verified Workers %, High-Risk Workers.
- **Chart**: Trust Score distribution histogram (0–20, 21–40, 41–60, 61–80, 81–100).
- **Bulk Actions**: Trigger Global Recalculation, Adjust Dimension Weights.

### 9. Analytics Engine
- **KPI Metrics**: Total Metric Events (24h), Daily Rollup Status, Event Ingestion Latency, Aggregation Storage.
- **Bulk Actions**: Re-run Daily Metrics Rollup Job (`lib/analytics/daily-rollup-job.ts`), Purge Stale Temp Snapshots.

### 10. Forecast Engine
- **KPI Metrics**: Active Forecast Models, Average Confidence Score %, Projected Bottleneck Count.
- **Table**: Forecast model list with target campaign predictions, confidence intervals, and actual completion variance.

### 11. Automation Platform
- **KPI Metrics**: Total Active Rules, Matched Rules / Min, Executed Actions / Min, Action Failure Rate.
- **Table**: Automation rule directory with Trigger Event type, Target Actions, and Execution counts.
- **Bulk Actions**: Toggle Rules On/Off, Batch Reset Action Failure Counters.

### 12. Webhook Operations
- **KPI Metrics**: Outbound Deliveries / Min, Success Rate %, DLQ Size, Average Delivery Latency (ms).
- **Table**: Webhook delivery log displaying Destination URL, HTTP Response Code, Retry Attempt Count, and Payload ID.
- **Bulk Actions**: Replay Selected DLQ Deliveries, Flush Expired Webhook Logs.

### 13. Integration Marketplace
- **KPI Metrics**: Installed Connectors, Marketplace Catalog Size, Connector Sync Failures, Sync QPS.
- **Table**: Installed connector instances displaying Connector Manifest ID, Organization, Status, and Last Sync timestamp.
- **Bulk Actions**: Force Connector Re-sync, Revoke Connector OAuth Grants.

### 14. Audit Logs
- **KPI Metrics**: Total Security Audit Events (24h), Sensitive Actions Logged, Failed Admin Logins, Exported Reports.
- **Table**: Immutable audit trail viewer with filters for Actor ID, Action Type (`auth.login`, `org.suspend`, `payout.approve`), and Severity.
- **Bulk Actions**: Export Filtered Audit Trail (CSV / JSON).

### 15. Security & Threat Mitigation
- **KPI Metrics**: Active Blocked IPs, Failed Auth Rate (5m), CSRF Mismatch Count, SSRF Blocked Requests.
- **Table**: Security alert log displaying Threat Class, Source IP, Target Endpoint, and Action Taken.
- **Bulk Actions**: Unblock IP, Revoke Compromised API Keys, Force Password Reset for Affected Users.

### 16. Feature Flags
- **KPI Metrics**: Active Feature Flags, Percentage Rollout Flags, User Override Rules Count.
- **Table**: Feature flag list displaying Flag Key (`DEVELOPER_PORTAL`, `SDK_GENERATION`), Status, Rollout %, and Target Segments.
- **Bulk Actions**: Enable Flag Globally, Disable Flag Globally, Set Rollout Percentage.

### 17. Support Triage
- **KPI Metrics**: Open Support Tickets, Average Response Time, Unassigned Tickets, High-Priority Issues.
- **Table**: Ticket queue displaying Ticket ID, Subject, User, Priority (`P1`, `P2`, `P3`), and Assigned Agent.
- **Bulk Actions**: Batch Assign to Support Agent, Batch Close Resolved Tickets.

### 18. Incident Response Center
- **KPI Metrics**: Current Platform State (`Operational`, `Degraded`, `Partial Outage`), Active Incident ID, MTTR.
- **Playbook**: Declare Incident (`P1 - Critical Outage` to `P4 - Minor Degraded`), Update Status Page, Resolve Incident.
- **Bulk Actions**: Broadcast Incident Banner to Active Sessions, Trigger Emergency Circuit Breaker.
