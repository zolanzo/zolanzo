/**
 * Starter Automation Library templates (~20).
 * Compose 4.4A triggers / conditions / actions only.
 */

import type { AutomationTemplate } from "@/lib/automation/library/types";

export const STARTER_TEMPLATES: AutomationTemplate[] = [
  // ── Workers ────────────────────────────────────────
  {
    id: "worker.welcome",
    name: "Worker welcome",
    description: "Welcome newly registered workers with an in-app notification.",
    category: "workers",
    trigger: "worker.registered",
    conditions: null,
    actions: [
      {
        type: "send_notification",
        params: { event: "auth.welcome" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 50,
  },
  {
    id: "worker.assignment_reminder",
    name: "Assignment reminder",
    description: "Remind workers after assignment acceptance (follow-up nudge).",
    category: "workers",
    trigger: "assignment.accepted",
    conditions: null,
    actions: [
      {
        type: "send_notification",
        params: { event: "assignment.reminder" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 80,
  },
  {
    id: "worker.overdue_assignment_reminder",
    name: "Overdue assignment reminder",
    description: "Nudge workers when assignment completion events stall.",
    category: "workers",
    trigger: "assignment.accepted",
    conditions: {
      logic: "and",
      conditions: [
        { field: "assignmentCount", op: "gte", value: "{{minOpenAssignments}}" },
      ],
    },
    actions: [
      {
        type: "send_notification",
        params: { event: "assignment.reminder" },
      },
    ],
    parameters: [
      {
        key: "minOpenAssignments",
        label: "Min open assignments",
        type: "number",
        defaultValue: 1,
      },
    ],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 90,
  },
  {
    id: "worker.identity_verification_reminder",
    name: "Identity verification reminder",
    description: "Suggest identity verification after worker registration.",
    category: "workers",
    trigger: "worker.registered",
    conditions: null,
    actions: [
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 60,
  },
  {
    id: "worker.achievement_notification",
    name: "Worker achievement notification",
    description: "Congratulate workers on trust milestone achievements.",
    category: "workers",
    trigger: "trust.updated",
    conditions: {
      logic: "and",
      conditions: [
        { field: "trustScore", op: "gte", value: "{{milestoneScore}}" },
      ],
    },
    actions: [
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
    ],
    parameters: [
      {
        key: "milestoneScore",
        label: "Trust milestone score",
        type: "number",
        defaultValue: 90,
      },
    ],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 70,
  },

  // ── Operations ─────────────────────────────────────
  {
    id: "ops.review_sla_warning",
    name: "Review SLA warning",
    description: "Notify when submissions are rejected (SLA pressure signal).",
    category: "operations",
    trigger: "submission.rejected",
    conditions: null,
    actions: [
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
      { type: "create_review_task", params: { queue: "review" } },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 40,
  },
  {
    id: "ops.review_queue_escalation",
    name: "Review queue escalation",
    description: "Escalate rejected submissions to operations.",
    category: "operations",
    trigger: "submission.rejected",
    conditions: {
      logic: "and",
      conditions: [
        { field: "revisionCount", op: "gte", value: "{{maxRevisions}}" },
      ],
    },
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "revision_threshold", queue: "review" },
      },
    ],
    parameters: [
      {
        key: "maxRevisions",
        label: "Max revisions before escalate",
        type: "number",
        defaultValue: 2,
      },
    ],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 30,
  },
  {
    id: "ops.review_backlog_alert",
    name: "Review backlog alert",
    description: "Escalate when assignment completions outpace reviews.",
    category: "operations",
    trigger: "assignment.completed",
    conditions: null,
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "review_backlog", queue: "review" },
      },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 55,
  },
  {
    id: "ops.payment_failure_alert",
    name: "Payment failure alert",
    description: "Alert operations when payment status is failed.",
    category: "operations",
    trigger: "payment.settled",
    conditions: {
      logic: "and",
      conditions: [
        { field: "paymentStatus", op: "eq", value: "{{failureStatus}}" },
      ],
    },
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "payment_failure", queue: "payment" },
      },
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
    ],
    parameters: [
      {
        key: "failureStatus",
        label: "Failure status value",
        type: "string",
        defaultValue: "failed",
      },
    ],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 20,
  },
  {
    id: "ops.fraud_escalation",
    name: "Fraud escalation",
    description: "Escalate fraud-related trust deterioration events.",
    category: "operations",
    trigger: "trust.updated",
    conditions: {
      logic: "or",
      conditions: [
        { field: "trend", op: "eq", value: "declining" },
        { field: "fraudFlag", op: "eq", value: true },
      ],
    },
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "fraud_trust", queue: "fraud" },
      },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 15,
  },

  // ── Campaigns ──────────────────────────────────────
  {
    id: "campaign.completion_alert",
    name: "Campaign completion alert",
    description: "Notify when assignment completion events fire for a campaign.",
    category: "campaigns",
    trigger: "assignment.completed",
    conditions: null,
    actions: [
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 75,
  },
  {
    id: "campaign.sla_risk_alert",
    name: "Campaign SLA risk alert",
    description: "Escalate when forecast confidence is below threshold.",
    category: "campaigns",
    trigger: "forecast.generated",
    conditions: {
      logic: "and",
      conditions: [
        { field: "confidence", op: "lt", value: "{{minConfidence}}" },
      ],
    },
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "campaign_sla_risk", queue: "campaign" },
      },
    ],
    parameters: [
      {
        key: "minConfidence",
        label: "Minimum forecast confidence",
        type: "number",
        defaultValue: 50,
      },
    ],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 35,
  },
  {
    id: "campaign.forecast_refresh",
    name: "Forecast refresh",
    description: "Request a campaign forecast refresh after report generation.",
    category: "campaigns",
    trigger: "report.generated",
    conditions: null,
    actions: [
      {
        type: "request_forecast_refresh",
        params: { forecastType: "campaign" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 85,
  },
  {
    id: "campaign.weekly_report",
    name: "Weekly campaign report",
    description: "Schedule a weekly campaign report after campaign creation.",
    category: "campaigns",
    trigger: "campaign.created",
    conditions: null,
    actions: [
      {
        type: "schedule_report",
        params: {
          reportType: "campaign",
          frequency: "weekly",
          format: "json",
        },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 65,
  },

  // ── Organizations ──────────────────────────────────
  {
    id: "org.weekly_executive_report",
    name: "Weekly executive report",
    description: "Generate an executive report when a report event completes.",
    category: "organizations",
    trigger: "report.generated",
    conditions: null,
    actions: [
      {
        type: "generate_report",
        params: { reportType: "executive", format: "json" },
      },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 95,
  },
  {
    id: "org.monthly_finance_report",
    name: "Monthly finance report",
    description: "Schedule a monthly finance report for the organization.",
    category: "organizations",
    trigger: "payment.settled",
    conditions: null,
    actions: [
      {
        type: "schedule_report",
        params: {
          reportType: "finance",
          frequency: "monthly",
          format: "csv",
        },
      },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 100,
  },
  {
    id: "org.trust_summary",
    name: "Organization trust summary",
    description: "Generate a trust report when trust profiles update.",
    category: "organizations",
    trigger: "trust.updated",
    conditions: null,
    actions: [
      {
        type: "generate_report",
        params: { reportType: "trust", format: "json" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 88,
  },
  {
    id: "org.high_rejection_alert",
    name: "High rejection rate alert",
    description: "Escalate when rejection events signal elevated rejection rate.",
    category: "organizations",
    trigger: "submission.rejected",
    conditions: {
      logic: "and",
      conditions: [
        { field: "approvalRate", op: "lt", value: "{{minApprovalRate}}" },
      ],
    },
    actions: [
      {
        type: "escalate_operations",
        params: { reason: "high_rejection_rate", queue: "quality" },
      },
    ],
    parameters: [
      {
        key: "minApprovalRate",
        label: "Min approval rate %",
        type: "number",
        defaultValue: 70,
      },
    ],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 25,
  },

  // ── Trust ──────────────────────────────────────────
  {
    id: "trust.milestone_notification",
    name: "Trust milestone notification",
    description: "Notify when trust score crosses a badge milestone.",
    category: "trust",
    trigger: "trust.updated",
    conditions: {
      logic: "and",
      conditions: [
        { field: "trustScore", op: "gte", value: "{{badgeScore}}" },
      ],
    },
    actions: [
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
    ],
    parameters: [
      {
        key: "badgeScore",
        label: "Badge threshold score",
        type: "number",
        defaultValue: 85,
      },
    ],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 45,
  },
  {
    id: "trust.decline_warning",
    name: "Trust decline warning",
    description: "Warn when trust trend is declining.",
    category: "trust",
    trigger: "trust.updated",
    conditions: {
      logic: "and",
      conditions: [{ field: "trend", op: "eq", value: "declining" }],
    },
    actions: [
      {
        type: "send_notification",
        params: { event: "security.alert" },
      },
    ],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 40,
  },
  {
    id: "trust.periodic_recalculation",
    name: "Periodic trust recalculation",
    description: "Recalculate trust after assignment completion.",
    category: "trust",
    trigger: "assignment.completed",
    conditions: null,
    actions: [{ type: "recalculate_trust" }],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 110,
  },

  // ── Analytics ──────────────────────────────────────
  {
    id: "analytics.daily_snapshot",
    name: "Daily analytics snapshot",
    description: "Refresh analytics rollup/snapshot after report generation.",
    category: "analytics",
    trigger: "report.generated",
    conditions: null,
    actions: [{ type: "refresh_analytics_snapshot" }],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: true,
    priority: 120,
  },
  {
    id: "analytics.dashboard_refresh",
    name: "Dashboard refresh",
    description: "Refresh analytics snapshot after forecast generation.",
    category: "analytics",
    trigger: "forecast.generated",
    conditions: null,
    actions: [{ type: "refresh_analytics_snapshot" }],
    parameters: [],
    permissions: ["analytics.read"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 115,
  },
  {
    id: "analytics.monthly_finance_report",
    name: "Monthly finance analytics report",
    description: "Generate a finance report after payment settlement.",
    category: "analytics",
    trigger: "payment.settled",
    conditions: {
      logic: "and",
      conditions: [
        { field: "paymentStatus", op: "eq", value: "completed" },
      ],
    },
    actions: [
      {
        type: "generate_report",
        params: { reportType: "finance", format: "json" },
      },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 105,
  },
  {
    id: "analytics.quarterly_org_report",
    name: "Quarterly organization report",
    description: "Schedule a quarterly operations report for the organization.",
    category: "analytics",
    trigger: "campaign.created",
    conditions: null,
    actions: [
      {
        type: "schedule_report",
        params: {
          reportType: "operations",
          frequency: "quarterly",
          format: "pdf",
        },
      },
    ],
    parameters: [],
    permissions: ["analytics.admin"],
    version: "1.0.0",
    enabledByDefault: false,
    priority: 130,
  },
];
