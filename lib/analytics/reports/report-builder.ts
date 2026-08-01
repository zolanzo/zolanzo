/**
 * ReportBuilder — assembles ReportDocument from Analytics / Trust / Forecast / Dashboards.
 * Never computes business metrics. Never mutates domain state.
 */

import { REPORTS_ENGINE_MODEL_VERSION } from "@/lib/analytics/reports/types";
import {
  canAccessReport,
  filterReportSectionsForPermission,
} from "@/lib/analytics/reports/permissions";
import { allocateReportIds } from "@/lib/analytics/reports/store";
import type {
  BiReportType,
  ReportDocument,
  ReportRequest,
  ReportSection,
} from "@/lib/analytics/reports/types";

const META: Record<
  BiReportType,
  { title: string; description: string }
> = {
  executive: {
    title: "Executive Report",
    description: "Leadership KPI summary, portfolio, risks, and actions",
  },
  campaign: {
    title: "Campaign Report",
    description: "Progress, workforce, budget, ETA, and risks",
  },
  finance: {
    title: "Finance Report",
    description: "Revenue, settlements, payouts, and trends",
  },
  trust: {
    title: "Trust Report",
    description: "Distribution, verification, badges, and trajectories",
  },
  ai: {
    title: "AI Report",
    description: "Requests, routing, tokens, cost, latency, and errors",
  },
  operations: {
    title: "Operations Report",
    description: "Throughput, SLA, queues, utilization, and alerts",
  },
};

function section(
  id: string,
  title: string,
  rows: ReportSection["rows"],
  notes?: string[],
  summary?: string,
): ReportSection {
  return { id, title, rows, notes, summary: summary ?? null };
}

function row(
  label: string,
  value: string | number | null,
  unit?: string | null,
): ReportSection["rows"][number] {
  return { label, value, unit: unit ?? null };
}

async function loadSources(request: ReportRequest): Promise<{
  sections: ReportSection[];
  sources: string[];
}> {
  const sources: string[] = [];
  const sections: ReportSection[] = [];

  // Dashboards (view models only)
  try {
    const { getDashboard } = await import("@/lib/analytics/dashboards");
    const dashType =
      request.type === "ai"
        ? "ai"
        : request.type === "trust"
          ? "trust"
          : request.type === "finance"
            ? "finance"
            : request.type === "operations"
              ? "operations"
              : request.type === "campaign"
                ? "campaign"
                : "executive";
    const dash = await getDashboard({
      type: dashType,
      organizationId: request.organizationId,
      campaignId: request.campaignId,
      permissions: request.permissions,
      reference: request.reference,
      refresh: true,
    });
    if (dash) {
      sources.push("DashboardService");
      sections.push(
        section(
          `${request.type}.kpi_summary`,
          "KPI summary",
          dash.widgets.slice(0, 12).map((w) =>
            row(w.title, w.value.primary, w.value.unit),
          ),
          undefined,
          dash.description,
        ),
      );
      if (request.type === "executive" || request.type === "operations") {
        const alerts = dash.widgets.find((w) => w.kind === "alert");
        if (alerts?.items?.length) {
          sections.push(
            section(
              `${request.type}.operational_risks`,
              "Operational risks",
              alerts.items.map((i) => row(i.label, i.value)),
            ),
          );
        }
      }
    }
  } catch {
    /* optional */
  }

  // Forecast highlights
  if (
    request.type === "executive" ||
    request.type === "campaign" ||
    request.type === "finance" ||
    request.type === "operations" ||
    request.type === "trust" ||
    request.type === "ai"
  ) {
    try {
      const { getForecast } = await import("@/lib/analytics/forecast");
      const forecastType =
        request.type === "ai"
          ? "ai_operations"
          : request.type === "operations"
            ? "reviews"
            : request.type === "trust"
              ? "trust"
              : request.type === "finance"
                ? "finance"
                : "campaign";
      const forecast = await getForecast({
        type: forecastType,
        organizationId: request.organizationId,
        campaignId: request.campaignId,
        permissions: request.permissions,
        reference: request.reference,
      });
      if (forecast) {
        sources.push("ForecastService");
        sections.push(
          section(
            `${request.type}.forecast_highlights`,
            "Forecast highlights",
            [
              row("Confidence", forecast.confidence, "%"),
              row("Risk", forecast.riskLevel),
              ...forecast.predictions.slice(0, 6).map((p) =>
                row(p.label, p.value, p.unit),
              ),
            ],
            [`Model ${forecast.modelVersion}`, "advisoryOnly"],
          ),
        );
        if (forecast.recommendations.length > 0) {
          sections.push(
            section(
              `${request.type}.recommended_actions`,
              "Recommended actions",
              forecast.recommendations.map((r) =>
                row(r.title, r.action),
              ),
            ),
          );
        }
      }
    } catch {
      /* optional */
    }
  }

  // Trust telemetry (Trust report + executive trust overview)
  if (request.type === "trust" || request.type === "executive") {
    try {
      const { getTrustTelemetrySnapshot } = await import(
        "@/lib/trust/telemetry"
      );
      const { getPassportTelemetrySnapshot } = await import(
        "@/lib/trust/passport/passport-telemetry"
      );
      const trust = getTrustTelemetrySnapshot();
      const passport = getPassportTelemetrySnapshot();
      sources.push("TrustTelemetry", "PassportTelemetry");
      sections.push(
        section(
          "trust.overview",
          "Trust overview",
          [
            row("Average score", trust.averageScore, "score"),
            row("Improving", trust.risingCount, "profiles"),
            row("Declining", trust.fallingCount, "profiles"),
            row("Profiles scored", trust.scoredProfiles),
            row("Event failures", trust.eventsFailed),
          ],
        ),
      );
      sections.push(
        section(
          "trust.distribution",
          "Trust distribution",
          Object.entries(trust.distribution).map(([k, v]) => row(k, v)),
        ),
      );
      sections.push(
        section(
          "trust.badges",
          "Badge distribution",
          Object.entries(passport.badgeEarnCounts).map(([k, v]) =>
            row(k, v),
          ),
        ),
      );
    } catch {
      /* optional */
    }
  }

  // AI telemetry
  if (request.type === "ai" || request.type === "executive") {
    try {
      const { getAiTelemetrySnapshot } = await import("@/lib/ai/telemetry");
      const ai = getAiTelemetrySnapshot();
      sources.push("AiTelemetry");
      sections.push(
        section(
          "ai.utilization",
          "AI utilization",
          [
            row("Requests", ai.totals.requests),
            row("Failures", ai.totals.failures),
            row("Avg latency", ai.totals.avgLatencyMs, "ms"),
            row("Tokens", ai.totals.totalTokens),
          ],
        ),
      );
      sections.push(
        section(
          "ai.cost_detail",
          "AI cost detail",
          [
            row("Estimated cost", ai.totals.totalCostMicroUsd, "µUSD"),
            ...Object.entries(ai.byProvider).map(([k, v]) =>
              row(`${k} requests`, v.requests),
            ),
          ],
        ),
      );
    } catch {
      /* optional */
    }
  }

  // Analytics metrics for finance/ops/campaign portfolio
  try {
    const { AnalyticsService } = await import("@/lib/analytics");
    const metrics = await AnalyticsService.queryMetrics({
      dimension: request.organizationId
        ? "organization"
        : request.campaignId
          ? "campaign"
          : "global",
      dimensionKey:
        request.organizationId ?? request.campaignId ?? "_",
      limit: 100,
    });
    if (metrics.length > 0) {
      sources.push("AnalyticsService");
      if (request.type === "finance" || request.type === "executive") {
        sections.push(
          section(
            "finance.summary",
            "Financial summary",
            metrics
              .filter((m) => m.metricKey.startsWith("payment."))
              .slice(0, 10)
              .map((m) => row(m.metricKey, m.value)),
          ),
        );
        sections.push(
          section(
            "finance.cost_detail",
            "Payment detail",
            metrics
              .filter((m) => m.metricKey.includes("amount"))
              .slice(0, 5)
              .map((m) => row(m.metricKey, m.value, "minor")),
          ),
        );
      }
      if (request.type === "campaign" || request.type === "executive") {
        sections.push(
          section(
            "campaign.portfolio",
            "Campaign / assignment metrics",
            metrics
              .filter(
                (m) =>
                  m.metricKey.startsWith("campaign.") ||
                  m.metricKey.startsWith("assignment."),
              )
              .slice(0, 12)
              .map((m) => row(m.metricKey, m.value)),
          ),
        );
      }
      if (request.type === "operations") {
        sections.push(
          section(
            "operations.throughput",
            "Assignment / review throughput",
            metrics
              .filter(
                (m) =>
                  m.metricKey.startsWith("assignment.") ||
                  m.metricKey.startsWith("review."),
              )
              .slice(0, 12)
              .map((m) => row(m.metricKey, m.value)),
          ),
        );
      }
    }
  } catch {
    /* optional */
  }

  if (sections.length === 0) {
    sections.push(
      section(
        `${request.type}.empty`,
        "No upstream data",
        [row("Status", "No analytics/dashboard/forecast signals available")],
        ["Generate analytics events or dashboards first"],
      ),
    );
  }

  return { sections, sources: [...new Set(sources)] };
}

export async function buildReport(
  request: ReportRequest,
): Promise<ReportDocument | null> {
  if (!canAccessReport(request.type, request.permissions)) return null;

  const meta = META[request.type];
  const { sections: rawSections, sources } = await loadSources(request);
  const { sections, filtered } = filterReportSectionsForPermission(
    rawSections,
    request.permissions,
  );
  const ids = allocateReportIds();

  return {
    id: ids.id,
    publicId: ids.publicId,
    type: request.type,
    title: meta.title,
    description: meta.description,
    sections,
    modelVersion: REPORTS_ENGINE_MODEL_VERSION,
    generatedAt: new Date().toISOString(),
    scope: {
      organizationId: request.organizationId ?? null,
      campaignId: request.campaignId ?? null,
    },
    sources: filtered
      ? [...sources, "permission_filter"]
      : sources,
    advisoryOnly: true,
  };
}

export const ReportBuilder = {
  build: buildReport,
};
