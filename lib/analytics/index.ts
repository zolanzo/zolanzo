/**
 * Analytics Foundation — Phase 4.3A public exports.
 */

export {
  ANALYTICS_MODEL_VERSION,
  ANALYTICS_SOURCES,
  ANALYTICS_EVENT_TYPES,
  ANALYTICS_EVENT_STATUSES,
  AGGREGATION_PERIODS,
  ANALYTICS_REPORT_TYPES,
  ANALYTICS_DIMENSIONS,
  type AnalyticsSource,
  type AnalyticsEventType,
  type AnalyticsEventStatus,
  type AggregationPeriod,
  type AnalyticsReportType,
  type AnalyticsDimension,
  type AnalyticsEventRecord,
  type AnalyticsDailyMetric,
  type AnalyticsSnapshotRecord,
  type AnalyticsReportRecord,
  type RecordAnalyticsEventInput,
  type AnalyticsQueryFilter,
  type AnalyticsMetricQuery,
} from "@/lib/analytics/types";

export {
  isAnalyticsEngineEnabled,
  isAnalyticsSnapshotsEnabled,
  isAnalyticsReportsEnabled,
} from "@/lib/analytics/config";

export {
  AnalyticsService,
  AnalyticsEventService,
  record,
  query,
  queryMetrics,
  snapshot,
  rollup,
  report,
  setAnalyticsBackend,
  getAnalyticsBackend,
} from "@/lib/analytics/analytics-service";

export {
  contributionsForEvent,
  aggregateEventsToDailyMetrics,
  rollupMetrics,
} from "@/lib/analytics/aggregator";

export {
  periodWindowFor,
  toMetricDate,
  datesInRange,
} from "@/lib/analytics/period";

export {
  EVENT_SOURCE_MAP,
  countMetricKey,
  defaultMetricValue,
} from "@/lib/analytics/event-catalog";

export {
  getAnalyticsTelemetrySnapshot,
  resetAnalyticsTelemetryForTests,
} from "@/lib/analytics/telemetry";

export {
  resetAnalyticsMemoryStoreForTests,
  memoryAllEvents,
} from "@/lib/analytics/memory-store";

export {
  DashboardService,
  WidgetRegistry,
  WidgetRenderer,
  DashboardBuilder,
  DashboardCache,
  getDashboard,
  listAvailableDashboards,
  isAnalyticsDashboardsEnabled,
  isExecutiveDashboardEnabled,
  isOperationsDashboardEnabled,
  DASHBOARD_TYPES,
  DASHBOARD_MODEL_VERSION,
  type DashboardType,
  type DashboardViewModel,
} from "@/lib/analytics/dashboards";

export {
  ForecastService,
  ForecastEngine,
  ForecastRegistry,
  RecommendationBuilder,
  ForecastCache,
  getForecast,
  listAvailableForecasts,
  isForecastEngineEnabled,
  isForecastRecommendationsEnabled,
  isForecastModelsEnabled,
  FORECAST_TYPES,
  FORECAST_ENGINE_MODEL_VERSION,
  getForecastSnippetForCopilot,
  type ForecastType,
  type ForecastResult,
} from "@/lib/analytics/forecast";

export {
  ReportService,
  ReportBuilder,
  RendererRegistry,
  ExportService,
  ScheduleService,
  generateReport,
  executeDueSchedules,
  isReportsEngineEnabled,
  isReportExportsEnabled,
  isReportSchedulesEnabled,
  BI_REPORT_TYPES,
  EXPORT_FORMATS,
  REPORTS_ENGINE_MODEL_VERSION,
  type BiReportType,
  type ReportDocument,
  type ExportArtifact,
} from "@/lib/analytics/reports";
