-- Phase 4.2B — Trust Persistence

CREATE TABLE "trust_profiles" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "user_id" TEXT,
    "overall_score" INTEGER NOT NULL,
    "identity_score" INTEGER NOT NULL,
    "reliability_score" INTEGER NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "behavior_score" INTEGER NOT NULL,
    "experience_score" INTEGER NOT NULL,
    "reputation_score" INTEGER NOT NULL,
    "trend" TEXT NOT NULL DEFAULT 'unknown',
    "trend_delta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "dimension_details" JSONB,
    "last_influencing_events" JSONB,
    "last_event_at" TIMESTAMP(3),
    "last_calculated_at" TIMESTAMP(3) NOT NULL,
    "model_version" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "trust_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trust_profiles_public_id_key" ON "trust_profiles"("public_id");
CREATE UNIQUE INDEX "trust_profiles_subject_type_subject_id_key" ON "trust_profiles"("subject_type", "subject_id");
CREATE INDEX "trust_profiles_overall_score_idx" ON "trust_profiles"("overall_score");
CREATE INDEX "trust_profiles_trend_idx" ON "trust_profiles"("trend");
CREATE INDEX "trust_profiles_last_calculated_at_idx" ON "trust_profiles"("last_calculated_at");
CREATE INDEX "trust_profiles_user_id_idx" ON "trust_profiles"("user_id");

ALTER TABLE "trust_profiles" ADD CONSTRAINT "trust_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trust_events" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "user_id" TEXT,
    "profile_id" TEXT,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "processor_version" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "sequence" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMP(3),
    "error_message" TEXT,
    "raw_weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "decayed_weight" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trust_events_public_id_key" ON "trust_events"("public_id");
CREATE UNIQUE INDEX "trust_events_idempotency_key_key" ON "trust_events"("idempotency_key");
CREATE INDEX "trust_events_subject_type_subject_id_occurred_at_idx"
  ON "trust_events"("subject_type", "subject_id", "occurred_at");
CREATE INDEX "trust_events_status_next_retry_at_idx" ON "trust_events"("status", "next_retry_at");
CREATE INDEX "trust_events_event_type_occurred_at_idx" ON "trust_events"("event_type", "occurred_at");
CREATE INDEX "trust_events_correlation_id_idx" ON "trust_events"("correlation_id");
CREATE INDEX "trust_events_user_id_occurred_at_idx" ON "trust_events"("user_id", "occurred_at");

ALTER TABLE "trust_events" ADD CONSTRAINT "trust_events_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "trust_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "trust_events" ADD CONSTRAINT "trust_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trust_score_history" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "identity_score" INTEGER NOT NULL,
    "reliability_score" INTEGER NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "behavior_score" INTEGER NOT NULL,
    "experience_score" INTEGER NOT NULL,
    "reputation_score" INTEGER NOT NULL,
    "trend" TEXT NOT NULL,
    "reasons" JSONB NOT NULL DEFAULT '[]',
    "trigger_event_id" TEXT,
    "calculated_at" TIMESTAMP(3) NOT NULL,
    "model_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trust_score_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trust_score_history_profile_id_calculated_at_idx"
  ON "trust_score_history"("profile_id", "calculated_at");

ALTER TABLE "trust_score_history" ADD CONSTRAINT "trust_score_history_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "trust_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
