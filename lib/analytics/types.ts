/**
 * Analytics Foundation types — Phase 4.3A.
 * Analytics never mutates domain data.
 */

export const ANALYTICS_MODEL_VERSION = "analytics-engine/1.0.0";

export const ANALYTICS_SOURCES = [
  "assignments",
  "campaigns",
  "organizations",
  "payments",
  "wallet",
  "reviews",
  "trust",
  "ai",
  "notifications",
  "storage",
  "authentication",
  "marketplace",
] as const;

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number];

export const ANALYTICS_EVENT_TYPES = [
  "assignment.created",
  "assignment.completed",
  "campaign.created",
  "campaign.completed",
  "payment.completed",
  "payment.failed",
  "trust.updated",
  "review.completed",
  "worker.registered",
  "organization.created",
  "notification.sent",
  "notification.failed",
  "storage.uploaded",
  "login.success",
  "login.failed",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const ANALYTICS_EVENT_STATUSES = [
  "pending",
  "processed",
  "failed",
  "dead_letter",
] as const;

export type AnalyticsEventStatus = (typeof ANALYTICS_EVENT_STATUSES)[number];

export const AGGREGATION_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type AggregationPeriod = (typeof AGGREGATION_PERIODS)[number];

export const ANALYTICS_REPORT_TYPES = [
  "campaign",
  "worker",
  "organization",
  "finance",
  "trust",
  "ai",
  "operations",
] as const;

export type AnalyticsReportType = (typeof ANALYTICS_REPORT_TYPES)[number];

export const ANALYTICS_DIMENSIONS = [
  "global",
  "organization",
  "campaign",
  "worker",
  "source",
  "event_type",
] as const;

export type AnalyticsDimension = (typeof ANALYTICS_DIMENSIONS)[number];

export type AnalyticsEventRecord = {
  id: string;
  publicId: string;
  source: AnalyticsSource;
  eventType: AnalyticsEventType;
  entityType: string | null;
  entityId: string | null;
  organizationId: string | null;
  userId: string | null;
  payload: Record<string, unknown>;
  occurredAt: string;
  processedAt: string | null;
  idempotencyKey: string;
  correlationId: string | null;
  causationId: string | null;
  status: AnalyticsEventStatus;
  attemptCount: number;
  errorMessage: string | null;
  metricValue: number;
  modelVersion: string;
  createdAt: string;
};

export type AnalyticsDailyMetric = {
  id: string;
  metricDate: string; // YYYY-MM-DD
  dimension: AnalyticsDimension;
  dimensionKey: string;
  metricKey: string;
  value: number;
  eventCount: number;
  updatedAt: string;
};

export type AnalyticsSnapshotRecord = {
  id: string;
  publicId: string;
  period: AggregationPeriod;
  periodStart: string;
  periodEnd: string;
  scope: AnalyticsDimension;
  scopeId: string;
  payload: Record<string, unknown>;
  durationMs: number;
  modelVersion: string;
  generatedAt: string;
};

export type AnalyticsReportRecord = {
  id: string;
  publicId: string;
  reportType: AnalyticsReportType;
  title: string;
  scope: AnalyticsDimension;
  scopeId: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "ready" | "failed";
  payload: Record<string, unknown>;
  modelVersion: string;
  generatedAt: string;
  errorMessage: string | null;
};

export type RecordAnalyticsEventInput = {
  source: AnalyticsSource;
  eventType: AnalyticsEventType;
  idempotencyKey: string;
  entityType?: string | null;
  entityId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  payload?: Record<string, unknown>;
  occurredAt?: Date | string;
  correlationId?: string;
  causationId?: string;
  /** Numeric contribution (counts default to 1; payments may pass amount) */
  metricValue?: number;
};

export type AnalyticsQueryFilter = {
  source?: AnalyticsSource;
  eventType?: AnalyticsEventType;
  organizationId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
  status?: AnalyticsEventStatus;
  limit?: number;
};

export type AnalyticsMetricQuery = {
  metricKey?: string;
  dimension?: AnalyticsDimension;
  dimensionKey?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export type AnalyticsHealthCounters = {
  eventsRecorded: number;
  eventsDuplicate: number;
  eventsFailed: number;
  eventsDeadLetter: number;
  rollupsRun: number;
  snapshotsGenerated: number;
  reportsGenerated: number;
  failures: number;
  totalRecordLatencyMs: number;
  totalRollupLatencyMs: number;
  totalSnapshotLatencyMs: number;
  lastLatencyMs: number | null;
  lastAt: string | null;
  eventsBySource: Record<string, number>;
  visibilityUsage: Record<string, number>;
};
