/**
 * Widget registry — modular dashboard widgets.
 * Widgets map upstream aggregates → view models. No business metric computation.
 */

import type {
  DashboardBuildInput,
  DashboardType,
  WidgetViewModel,
} from "@/lib/analytics/dashboards/types";
import {
  loadPeriodTotals,
  metric,
  rate,
  type MetricBag,
} from "@/lib/analytics/dashboards/analytics-source";

export type WidgetContext = {
  input: DashboardBuildInput;
  totals: MetricBag;
  eventTypes: Record<string, number>;
  queryDurationMs: number;
  generatedAt: string;
  /** Optional upstream snapshots (trust / ai / passport) */
  trust?: {
    averageScore: number;
    distribution: Record<string, number>;
    risingTrust: number;
    fallingTrust: number;
    profiles: number;
    eventsFailed: number;
    badgeDistribution?: Record<string, number>;
  } | null;
  ai?: {
    requests: number;
    failures: number;
    avgLatencyMs: number;
    totalTokens: number;
    totalCostMicroUsd: number;
    byProvider?: Record<string, { requests: number; failures: number }>;
  } | null;
  /** Optional forecast summary for ETA / decision widgets */
  forecast?: {
    campaignEta: string | null;
    campaignConfidence: number | null;
    campaignRisk: string | null;
    advisoryOnly: true;
  } | null;
};

export type WidgetDefinition = {
  id: string;
  dashboards: DashboardType[];
  title: string;
  description: string;
  dataSource: WidgetViewModel["dataSource"];
  kind: WidgetViewModel["kind"];
  render: (ctx: WidgetContext) => WidgetViewModel;
};

function baseWidget(
  def: WidgetDefinition,
  ctx: WidgetContext,
  patch: Partial<WidgetViewModel> & {
    value: WidgetViewModel["value"];
    status: WidgetViewModel["status"];
  },
): WidgetViewModel {
  return {
    id: def.id,
    dashboard: ctx.input.type,
    title: def.title,
    description: def.description,
    kind: def.kind,
    dataSource: def.dataSource,
    series: patch.series,
    items: patch.items,
    value: patch.value,
    status: patch.status,
    errorMessage: patch.errorMessage ?? null,
    queryDurationMs: ctx.queryDurationMs,
    cached: false,
    generatedAt: ctx.generatedAt,
  };
}

function kpi(
  def: WidgetDefinition,
  ctx: WidgetContext,
  primary: number | string | null,
  opts?: {
    unit?: string;
    secondary?: string | number | null;
    trend?: WidgetViewModel["value"]["trend"];
    status?: WidgetViewModel["status"];
  },
): WidgetViewModel {
  const empty =
    primary == null ||
    primary === "" ||
    (typeof primary === "number" && primary === 0 && opts?.status !== "ok");
  return baseWidget(def, ctx, {
    value: {
      primary,
      secondary: opts?.secondary ?? null,
      unit: opts?.unit ?? null,
      trend: opts?.trend ?? "unknown",
    },
    status: opts?.status ?? (empty ? "empty" : "ok"),
  });
}

const WIDGETS: WidgetDefinition[] = [
  // ── Executive ──────────────────────────────────────
  {
    id: "executive.active_campaigns",
    dashboards: ["executive", "organization"],
    title: "Active campaigns",
    description: "Campaigns created vs completed in period",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const created = metric(ctx.totals, "campaign.created.count");
      const completed = metric(ctx.totals, "campaign.completed.count");
      const active = Math.max(created - completed, 0);
      return kpi(WIDGETS.find((w) => w.id === "executive.active_campaigns")!, ctx, active, {
        secondary: `${completed} completed`,
        unit: "campaigns",
        status: "ok",
      });
    },
  },
  {
    id: "executive.completion_rate",
    dashboards: ["executive", "campaign", "organization"],
    title: "Completion rate",
    description: "Assignments completed / created",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const created = metric(ctx.totals, "assignment.created.count");
      const completed = metric(ctx.totals, "assignment.completed.count");
      const r = rate(completed, created);
      return kpi(
        WIDGETS.find((w) => w.id === "executive.completion_rate")!,
        ctx,
        r,
        { unit: "%", secondary: `${completed}/${created}`, status: "ok" },
      );
    },
  },
  {
    id: "executive.workforce_utilization",
    dashboards: ["executive", "organization"],
    title: "Workforce utilization",
    description: "Workers with assignment activity",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const assignments = metric(ctx.totals, "assignment.created.count");
      return kpi(
        WIDGETS.find((w) => w.id === "executive.workforce_utilization")!,
        ctx,
        assignments,
        { unit: "assignments", status: "ok" },
      );
    },
  },
  {
    id: "executive.revenue",
    dashboards: ["executive", "finance"],
    title: "Revenue / payout volume",
    description: "Payment completed amount (minor units)",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const amount = metric(ctx.totals, "payment.completed.amount");
      return kpi(WIDGETS.find((w) => w.id === "executive.revenue")!, ctx, amount, {
        unit: "minor",
        status: "ok",
      });
    },
  },
  {
    id: "executive.payments",
    dashboards: ["executive", "finance"],
    title: "Payments",
    description: "Completed vs failed payments",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const ok = metric(ctx.totals, "payment.completed.count");
      const fail = metric(ctx.totals, "payment.failed.count");
      return kpi(WIDGETS.find((w) => w.id === "executive.payments")!, ctx, ok, {
        secondary: `${fail} failed`,
        unit: "payments",
        status: "ok",
      });
    },
  },
  {
    id: "executive.trust_trend",
    dashboards: ["executive", "trust", "worker"],
    title: "Trust trend",
    description: "Improving vs declining trust profiles",
    dataSource: "trust",
    kind: "trend",
    render: (ctx) => {
      const rising = ctx.trust?.risingTrust ?? 0;
      const falling = ctx.trust?.fallingTrust ?? 0;
      const trend =
        rising > falling ? "up" : falling > rising ? "down" : "flat";
      return baseWidget(
        WIDGETS.find((w) => w.id === "executive.trust_trend")!,
        ctx,
        {
          value: {
            primary: ctx.trust?.averageScore ?? null,
            secondary: `↑${rising} ↓${falling}`,
            unit: "score",
            trend,
            trendLabel: trend === "up" ? "Improving" : trend === "down" ? "Declining" : "Stable",
          },
          status: ctx.trust ? "ok" : "empty",
        },
      );
    },
  },
  {
    id: "executive.ai_usage",
    dashboards: ["executive", "ai"],
    title: "AI usage",
    description: "AI requests in telemetry window",
    dataSource: "ai",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "executive.ai_usage")!,
        ctx,
        ctx.ai?.requests ?? 0,
        {
          secondary: `${ctx.ai?.failures ?? 0} errors`,
          unit: "requests",
          status: "ok",
        },
      ),
  },
  {
    id: "executive.growth",
    dashboards: ["executive"],
    title: "Growth",
    description: "New workers + organizations",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const workers = metric(ctx.totals, "worker.registered.count");
      const orgs = metric(ctx.totals, "organization.created.count");
      return kpi(WIDGETS.find((w) => w.id === "executive.growth")!, ctx, workers + orgs, {
        secondary: `${workers} workers · ${orgs} orgs`,
        status: "ok",
      });
    },
  },
  {
    id: "executive.operational_alerts",
    dashboards: ["executive", "operations"],
    title: "Operational alerts",
    description: "Failed payments, notifications, analytics DLQ signals",
    dataSource: "analytics",
    kind: "alert",
    render: (ctx) => {
      const failedPay = metric(ctx.totals, "payment.failed.count");
      const failedNtf = metric(ctx.totals, "notification.failed.count");
      const failedLogin = metric(ctx.totals, "login.failed.count");
      const items = [
        { label: "Failed payments", value: failedPay },
        { label: "Failed notifications", value: failedNtf },
        { label: "Failed logins", value: failedLogin },
      ].filter((i) => Number(i.value) > 0);
      return baseWidget(
        WIDGETS.find((w) => w.id === "executive.operational_alerts")!,
        ctx,
        {
          value: {
            primary: items.length,
            unit: "alerts",
            trend: items.length > 0 ? "down" : "flat",
          },
          items,
          status: items.length > 0 ? "degraded" : "ok",
        },
      );
    },
  },

  // ── Operations ─────────────────────────────────────
  {
    id: "operations.assignments_in_progress",
    dashboards: ["operations"],
    title: "Assignments in progress",
    description: "Created minus completed (proxy)",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const created = metric(ctx.totals, "assignment.created.count");
      const completed = metric(ctx.totals, "assignment.completed.count");
      return kpi(
        WIDGETS.find((w) => w.id === "operations.assignments_in_progress")!,
        ctx,
        Math.max(created - completed, 0),
        { unit: "assignments", status: "ok" },
      );
    },
  },
  {
    id: "operations.reviews_pending",
    dashboards: ["operations", "campaign"],
    title: "Reviews completed",
    description: "Review events in period (pending backlog via ops queue later)",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "operations.reviews_pending")!,
        ctx,
        metric(ctx.totals, "review.completed.count"),
        { unit: "reviews", status: "ok" },
      ),
  },
  {
    id: "operations.approval_rate",
    dashboards: ["operations", "campaign", "worker"],
    title: "Submission approval rate",
    description: "Reviews completed as approval proxy from analytics",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const reviews = metric(ctx.totals, "review.completed.count");
      return kpi(
        WIDGETS.find((w) => w.id === "operations.approval_rate")!,
        ctx,
        reviews,
        { unit: "reviews", secondary: "see Trust for quality", status: "ok" },
      );
    },
  },
  {
    id: "operations.bottlenecks",
    dashboards: ["operations"],
    title: "Bottlenecks",
    description: "Relative volume by event type",
    dataSource: "analytics",
    kind: "distribution",
    render: (ctx) => {
      const series = Object.entries(ctx.eventTypes)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      return baseWidget(
        WIDGETS.find((w) => w.id === "operations.bottlenecks")!,
        ctx,
        {
          value: { primary: series[0]?.label ?? null, unit: "top event" },
          series,
          status: series.length ? "ok" : "empty",
        },
      );
    },
  },
  {
    id: "operations.escalations",
    dashboards: ["operations"],
    title: "Escalations",
    description: "Failed payments + failed notifications",
    dataSource: "analytics",
    kind: "alert",
    render: (ctx) => {
      const n =
        metric(ctx.totals, "payment.failed.count") +
        metric(ctx.totals, "notification.failed.count");
      return kpi(
        WIDGETS.find((w) => w.id === "operations.escalations")!,
        ctx,
        n,
        { unit: "escalations", status: n > 0 ? "degraded" : "ok" },
      );
    },
  },
  {
    id: "operations.regional_workload",
    dashboards: ["operations", "organization", "campaign"],
    title: "Regional activity",
    description: "Placeholder until geo dimensions land in analytics",
    dataSource: "analytics",
    kind: "placeholder",
    render: (ctx) =>
      baseWidget(
        WIDGETS.find((w) => w.id === "operations.regional_workload")!,
        ctx,
        {
          value: {
            primary: null,
            secondary: "Geo dimensions in 4.3C+",
          },
          status: "empty",
        },
      ),
  },

  // ── Finance ────────────────────────────────────────
  {
    id: "finance.payments_today",
    dashboards: ["finance"],
    title: "Payments today",
    description: "Completed payment count",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "finance.payments_today")!,
        ctx,
        metric(ctx.totals, "payment.completed.count"),
        { unit: "payments", status: "ok" },
      ),
  },
  {
    id: "finance.failed_payments",
    dashboards: ["finance"],
    title: "Failed payments",
    description: "Failed payment count",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "finance.failed_payments")!,
        ctx,
        metric(ctx.totals, "payment.failed.count"),
        {
          unit: "payments",
          status:
            metric(ctx.totals, "payment.failed.count") > 0
              ? "degraded"
              : "ok",
        },
      ),
  },
  {
    id: "finance.daily_payout_volume",
    dashboards: ["finance"],
    title: "Daily payout volume",
    description: "Sum of payment.completed.amount",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "finance.daily_payout_volume")!,
        ctx,
        metric(ctx.totals, "payment.completed.amount"),
        { unit: "minor", status: "ok" },
      ),
  },
  {
    id: "finance.revenue_trend",
    dashboards: ["finance"],
    title: "Revenue trend",
    description: "Payment amount vs count",
    dataSource: "analytics",
    kind: "trend",
    render: (ctx) => {
      const amount = metric(ctx.totals, "payment.completed.amount");
      const count = metric(ctx.totals, "payment.completed.count");
      return baseWidget(
        WIDGETS.find((w) => w.id === "finance.revenue_trend")!,
        ctx,
        {
          value: {
            primary: amount,
            secondary: `${count} payments`,
            unit: "minor",
            trend: amount > 0 ? "up" : "flat",
          },
          status: "ok",
        },
      );
    },
  },
  {
    id: "finance.wallet_balances",
    dashboards: ["finance"],
    title: "Wallet activity",
    description: "Inferred from payment events (no direct wallet reads)",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "finance.wallet_balances")!,
        ctx,
        metric(ctx.totals, "payment.completed.count"),
        { unit: "settlements", secondary: "via analytics events", status: "ok" },
      ),
  },

  // ── Trust ──────────────────────────────────────────
  {
    id: "trust.average",
    dashboards: ["trust", "organization"],
    title: "Average trust",
    description: "From Trust Health API",
    dataSource: "trust",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "trust.average")!,
        ctx,
        ctx.trust?.averageScore ?? null,
        { unit: "score", status: ctx.trust ? "ok" : "empty" },
      ),
  },
  {
    id: "trust.distribution",
    dashboards: ["trust"],
    title: "Trust distribution",
    description: "Score bands from Trust Health",
    dataSource: "trust",
    kind: "distribution",
    render: (ctx) => {
      const series = Object.entries(ctx.trust?.distribution ?? {}).map(
        ([label, value]) => ({ label, value }),
      );
      return baseWidget(
        WIDGETS.find((w) => w.id === "trust.distribution")!,
        ctx,
        {
          value: { primary: ctx.trust?.profiles ?? 0, unit: "profiles" },
          series,
          status: series.length ? "ok" : "empty",
        },
      );
    },
  },
  {
    id: "trust.improving",
    dashboards: ["trust"],
    title: "Improving profiles",
    description: "Rising trust count",
    dataSource: "trust",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "trust.improving")!,
        ctx,
        ctx.trust?.risingTrust ?? 0,
        { trend: "up", status: "ok" },
      ),
  },
  {
    id: "trust.declining",
    dashboards: ["trust"],
    title: "Declining profiles",
    description: "Falling trust count",
    dataSource: "trust",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "trust.declining")!,
        ctx,
        ctx.trust?.fallingTrust ?? 0,
        { trend: "down", status: "ok" },
      ),
  },
  {
    id: "trust.fraud_events",
    dashboards: ["trust"],
    title: "Fraud / trust failures",
    description: "Trust event failures from Trust Health",
    dataSource: "trust",
    kind: "alert",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "trust.fraud_events")!,
        ctx,
        ctx.trust?.eventsFailed ?? 0,
        {
          status:
            (ctx.trust?.eventsFailed ?? 0) > 0 ? "degraded" : "ok",
        },
      ),
  },
  {
    id: "trust.badge_distribution",
    dashboards: ["trust", "worker"],
    title: "Badge distribution",
    description: "From Passport Health telemetry",
    dataSource: "passport",
    kind: "distribution",
    render: (ctx) => {
      const series = Object.entries(ctx.trust?.badgeDistribution ?? {}).map(
        ([label, value]) => ({ label, value }),
      );
      return baseWidget(
        WIDGETS.find((w) => w.id === "trust.badge_distribution")!,
        ctx,
        {
          value: { primary: series.length, unit: "badge types" },
          series,
          status: series.length ? "ok" : "empty",
        },
      );
    },
  },
  {
    id: "trust.identity_progress",
    dashboards: ["trust"],
    title: "Identity verification progress",
    description: "Trust-updated analytics events as proxy",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "trust.identity_progress")!,
        ctx,
        metric(ctx.totals, "trust.updated.count"),
        { unit: "updates", status: "ok" },
      ),
  },

  // ── AI ─────────────────────────────────────────────
  {
    id: "ai.requests",
    dashboards: ["ai"],
    title: "AI requests",
    description: "From AI telemetry",
    dataSource: "ai",
    kind: "kpi",
    render: (ctx) =>
      kpi(WIDGETS.find((w) => w.id === "ai.requests")!, ctx, ctx.ai?.requests ?? 0, {
        status: "ok",
      }),
  },
  {
    id: "ai.latency",
    dashboards: ["ai"],
    title: "Average latency",
    description: "AI telemetry avg latency",
    dataSource: "ai",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "ai.latency")!,
        ctx,
        ctx.ai?.avgLatencyMs ?? 0,
        { unit: "ms", status: "ok" },
      ),
  },
  {
    id: "ai.errors",
    dashboards: ["ai"],
    title: "Errors",
    description: "AI failure count",
    dataSource: "ai",
    kind: "alert",
    render: (ctx) =>
      kpi(WIDGETS.find((w) => w.id === "ai.errors")!, ctx, ctx.ai?.failures ?? 0, {
        status: (ctx.ai?.failures ?? 0) > 0 ? "degraded" : "ok",
      }),
  },
  {
    id: "ai.token_usage",
    dashboards: ["ai"],
    title: "Token usage",
    description: "Total tokens from AI telemetry",
    dataSource: "ai",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "ai.token_usage")!,
        ctx,
        ctx.ai?.totalTokens ?? 0,
        { unit: "tokens", status: "ok" },
      ),
  },
  {
    id: "ai.estimated_cost",
    dashboards: ["ai"],
    title: "Estimated cost",
    description: "Micro-USD from AI telemetry",
    dataSource: "ai",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "ai.estimated_cost")!,
        ctx,
        ctx.ai?.totalCostMicroUsd ?? 0,
        { unit: "µUSD", status: "ok" },
      ),
  },
  {
    id: "ai.rule_vs_ai",
    dashboards: ["ai"],
    title: "Provider mix",
    description: "Requests by provider (rule/mock/openai)",
    dataSource: "ai",
    kind: "distribution",
    render: (ctx) => {
      const series = Object.entries(ctx.ai?.byProvider ?? {}).map(
        ([label, v]) => ({ label, value: v.requests }),
      );
      return baseWidget(
        WIDGETS.find((w) => w.id === "ai.rule_vs_ai")!,
        ctx,
        {
          value: { primary: series.length, unit: "providers" },
          series,
          status: series.length ? "ok" : "empty",
        },
      );
    },
  },

  // ── Campaign / Worker extras ───────────────────────
  {
    id: "campaign.progress",
    dashboards: ["campaign"],
    title: "Campaign progress",
    description: "Assignment completion ratio",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const created = metric(ctx.totals, "assignment.created.count");
      const completed = metric(ctx.totals, "assignment.completed.count");
      return kpi(
        WIDGETS.find((w) => w.id === "campaign.progress")!,
        ctx,
        rate(completed, created),
        { unit: "%", status: "ok" },
      );
    },
  },
  {
    id: "campaign.eta_forecast",
    dashboards: ["campaign", "executive"],
    title: "ETA forecast",
    description: "From Forecast Engine (advisory)",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) => {
      const eta = ctx.forecast?.campaignEta ?? null;
      const confidence = ctx.forecast?.campaignConfidence ?? null;
      return baseWidget(
        WIDGETS.find((w) => w.id === "campaign.eta_forecast")!,
        ctx,
        {
          value: {
            primary: eta,
            secondary:
              confidence != null
                ? `${confidence}% confidence · advisory`
                : "Forecast unavailable",
            unit: "date",
            trend:
              ctx.forecast?.campaignRisk === "high" ||
              ctx.forecast?.campaignRisk === "critical"
                ? "down"
                : "flat",
          },
          status: eta ? "ok" : "empty",
        },
      );
    },
  },
  {
    id: "campaign.budget_consumption",
    dashboards: ["campaign"],
    title: "Budget consumption",
    description: "Payment amount attributed to campaign scope",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "campaign.budget_consumption")!,
        ctx,
        metric(ctx.totals, "payment.completed.amount"),
        { unit: "minor", status: "ok" },
      ),
  },
  {
    id: "worker.earnings",
    dashboards: ["worker"],
    title: "Earnings",
    description: "Payment completed amount for worker scope",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "worker.earnings")!,
        ctx,
        metric(ctx.totals, "payment.completed.amount"),
        { unit: "minor", status: "ok" },
      ),
  },
  {
    id: "worker.assignment_completion",
    dashboards: ["worker"],
    title: "Assignment completion",
    description: "Completed assignments",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "worker.assignment_completion")!,
        ctx,
        metric(ctx.totals, "assignment.completed.count"),
        { unit: "assignments", status: "ok" },
      ),
  },
  {
    id: "worker.passport_summary",
    dashboards: ["worker"],
    title: "Passport summary",
    description: "Average trust + badges (Trust/Passport APIs)",
    dataSource: "passport",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "worker.passport_summary")!,
        ctx,
        ctx.trust?.averageScore ?? null,
        {
          secondary: `${Object.keys(ctx.trust?.badgeDistribution ?? {}).length} badge types`,
          unit: "trust",
          status: ctx.trust ? "ok" : "empty",
        },
      ),
  },
  {
    id: "organization.active_workforce",
    dashboards: ["organization"],
    title: "Active workforce",
    description: "Assignment activity as workforce proxy",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "organization.active_workforce")!,
        ctx,
        metric(ctx.totals, "assignment.created.count"),
        { unit: "assignments", status: "ok" },
      ),
  },
  {
    id: "organization.spending",
    dashboards: ["organization"],
    title: "Spending",
    description: "Payment volume for organization",
    dataSource: "analytics",
    kind: "kpi",
    render: (ctx) =>
      kpi(
        WIDGETS.find((w) => w.id === "organization.spending")!,
        ctx,
        metric(ctx.totals, "payment.completed.amount"),
        { unit: "minor", status: "ok" },
      ),
  },
];

export function listWidgetDefinitions(
  type?: DashboardType,
): WidgetDefinition[] {
  if (!type) return [...WIDGETS];
  return WIDGETS.filter((w) => w.dashboards.includes(type));
}

export function getWidgetDefinition(id: string): WidgetDefinition | undefined {
  return WIDGETS.find((w) => w.id === id);
}

export function renderWidget(
  def: WidgetDefinition,
  ctx: WidgetContext,
): WidgetViewModel {
  try {
    return def.render(ctx);
  } catch (error) {
    return {
      id: def.id,
      dashboard: ctx.input.type,
      title: def.title,
      description: def.description,
      kind: def.kind,
      dataSource: def.dataSource,
      value: { primary: null },
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
      queryDurationMs: ctx.queryDurationMs,
      cached: false,
      generatedAt: ctx.generatedAt,
    };
  }
}

export const WidgetRegistry = {
  list: listWidgetDefinitions,
  get: getWidgetDefinition,
  render: renderWidget,
};

export { loadPeriodTotals };
