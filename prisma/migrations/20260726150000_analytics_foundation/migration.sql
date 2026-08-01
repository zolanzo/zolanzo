-- Phase 4.3A — Analytics Foundation

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "organization_id" TEXT,
    "user_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "processor_version" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMP(3),
    "error_message" TEXT,
    "metric_value" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_events_public_id_key" ON "analytics_events"("public_id");
CREATE UNIQUE INDEX "analytics_events_idempotency_key_key" ON "analytics_events"("idempotency_key");
CREATE INDEX "analytics_events_source_occurred_at_idx" ON "analytics_events"("source", "occurred_at");
CREATE INDEX "analytics_events_event_type_occurred_at_idx" ON "analytics_events"("event_type", "occurred_at");
CREATE INDEX "analytics_events_organization_id_occurred_at_idx" ON "analytics_events"("organization_id", "occurred_at");
CREATE INDEX "analytics_events_user_id_occurred_at_idx" ON "analytics_events"("user_id", "occurred_at");
CREATE INDEX "analytics_events_status_next_retry_at_idx" ON "analytics_events"("status", "next_retry_at");
CREATE INDEX "analytics_events_entity_type_entity_id_idx" ON "analytics_events"("entity_type", "entity_id");

CREATE TABLE "analytics_daily_metrics" (
    "id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "dimension" TEXT NOT NULL,
    "dimension_key" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "event_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "analytics_daily_metrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_daily_metrics_metric_date_dimension_dimension_key_metric_key_key"
  ON "analytics_daily_metrics"("metric_date", "dimension", "dimension_key", "metric_key");
CREATE INDEX "analytics_daily_metrics_metric_key_metric_date_idx"
  ON "analytics_daily_metrics"("metric_key", "metric_date");
CREATE INDEX "analytics_daily_metrics_dimension_dimension_key_metric_date_idx"
  ON "analytics_daily_metrics"("dimension", "dimension_key", "metric_date");

CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "duration_ms" INTEGER NOT NULL,
    "model_version" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_snapshots_public_id_key" ON "analytics_snapshots"("public_id");
CREATE INDEX "analytics_snapshots_period_generated_at_idx" ON "analytics_snapshots"("period", "generated_at");
CREATE INDEX "analytics_snapshots_scope_scope_id_generated_at_idx" ON "analytics_snapshots"("scope", "scope_id", "generated_at");

CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "model_version" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_reports_public_id_key" ON "analytics_reports"("public_id");
CREATE INDEX "analytics_reports_report_type_generated_at_idx" ON "analytics_reports"("report_type", "generated_at");
CREATE INDEX "analytics_reports_scope_scope_id_generated_at_idx" ON "analytics_reports"("scope", "scope_id", "generated_at");
CREATE INDEX "analytics_reports_status_idx" ON "analytics_reports"("status");
