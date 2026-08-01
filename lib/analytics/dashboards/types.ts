/**
 * Executive Dashboards — Phase 4.3B types.
 * Presentation only — never compute business metrics or write domain data.
 */

export const DASHBOARD_MODEL_VERSION = "analytics-dashboards/1.0.0";

export const DASHBOARD_TYPES = [
  "executive",
  "operations",
  "finance",
  "trust",
  "ai",
  "campaign",
  "worker",
  "organization",
] as const;

export type DashboardType = (typeof DASHBOARD_TYPES)[number];

export const WIDGET_KINDS = [
  "kpi",
  "distribution",
  "trend",
  "list",
  "alert",
  "placeholder",
] as const;

export type WidgetKind = (typeof WIDGET_KINDS)[number];

export const WIDGET_DATA_SOURCES = [
  "analytics",
  "trust",
  "ai",
  "passport",
] as const;

export type WidgetDataSource = (typeof WIDGET_DATA_SOURCES)[number];

export type WidgetValue = {
  primary: number | string | null;
  secondary?: number | string | null;
  unit?: string | null;
  trend?: "up" | "down" | "flat" | "unknown";
  trendLabel?: string | null;
};

export type WidgetViewModel = {
  id: string;
  dashboard: DashboardType;
  title: string;
  description: string;
  kind: WidgetKind;
  dataSource: WidgetDataSource;
  value: WidgetValue;
  /** Structured payload for charts / tables (already aggregated upstream). */
  series?: Array<{ label: string; value: number }>;
  items?: Array<{ label: string; value: string | number }>;
  status: "ok" | "degraded" | "empty" | "error" | "disabled";
  errorMessage?: string | null;
  queryDurationMs: number;
  cached: boolean;
  generatedAt: string;
};

export type DashboardViewModel = {
  type: DashboardType;
  title: string;
  description: string;
  modelVersion: string;
  widgets: WidgetViewModel[];
  cacheHit: boolean;
  renderLatencyMs: number;
  snapshotFreshnessMs: number | null;
  generatedAt: string;
  scope: {
    organizationId?: string | null;
    campaignId?: string | null;
    workerUserId?: string | null;
  };
  permissionsFiltered: boolean;
};

export type DashboardBuildInput = {
  type: DashboardType;
  organizationId?: string | null;
  campaignId?: string | null;
  workerUserId?: string | null;
  /** Role / permission keys for widget filtering */
  permissions?: string[];
  /** Bypass cache */
  refresh?: boolean;
  /** Reference time for period windows */
  reference?: Date;
};

export type DashboardHealthCounters = {
  builds: number;
  cacheHits: number;
  cacheMisses: number;
  widgetFailures: number;
  totalRenderLatencyMs: number;
  totalQueryDurationMs: number;
  lastRenderLatencyMs: number | null;
  lastAt: string | null;
  byDashboard: Record<string, number>;
};
