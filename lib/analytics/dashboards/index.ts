/**
 * Executive Dashboards — Phase 4.3B exports.
 */

export {
  DASHBOARD_MODEL_VERSION,
  DASHBOARD_TYPES,
  WIDGET_KINDS,
  WIDGET_DATA_SOURCES,
  type DashboardType,
  type WidgetKind,
  type WidgetDataSource,
  type WidgetViewModel,
  type DashboardViewModel,
  type DashboardBuildInput,
} from "@/lib/analytics/dashboards/types";

export {
  isAnalyticsDashboardsEnabled,
  isExecutiveDashboardEnabled,
  isOperationsDashboardEnabled,
  isDashboardTypeEnabled,
  DASHBOARD_CACHE_TTL_MS,
} from "@/lib/analytics/dashboards/config";

export {
  DashboardService,
  getDashboard,
  refreshDashboard,
  listAvailableDashboards,
  WidgetRenderer,
  renderDashboardWidgets,
} from "@/lib/analytics/dashboards/dashboard-service";

export { DashboardBuilder, buildDashboard } from "@/lib/analytics/dashboards/dashboard-builder";

export {
  WidgetRegistry,
  listWidgetDefinitions,
  getWidgetDefinition,
} from "@/lib/analytics/dashboards/widget-registry";

export {
  DashboardCache,
  invalidateDashboardCache,
  getDashboardCacheStats,
  resetDashboardCacheForTests,
} from "@/lib/analytics/dashboards/cache";

export {
  getDashboardTelemetrySnapshot,
  resetDashboardTelemetryForTests,
} from "@/lib/analytics/dashboards/telemetry";

export {
  canAccessDashboard,
  filterWidgetsByPermission,
} from "@/lib/analytics/dashboards/permissions";
