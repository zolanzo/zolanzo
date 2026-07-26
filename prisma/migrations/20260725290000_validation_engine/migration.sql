-- Validation Engine: profiles, reports, results, evidence snapshots

CREATE TABLE "validation_profiles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled_validators" JSONB NOT NULL,
    "rule_keys" JSONB NOT NULL DEFAULT '[]',
    "config" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validation_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "validation_profiles_key_key" ON "validation_profiles"("key");

CREATE TABLE "validation_reports" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "profile_key" TEXT NOT NULL,
    "profile_id" TEXT,
    "profile_snapshot" JSONB NOT NULL,
    "overall_status" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "failures" JSONB NOT NULL DEFAULT '[]',
    "passed_checks" INTEGER NOT NULL,
    "skipped_checks" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "immutable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "validation_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "validation_reports_public_id_key" ON "validation_reports"("public_id");
CREATE INDEX "validation_reports_submission_id_generated_at_idx" ON "validation_reports"("submission_id", "generated_at");
CREATE INDEX "validation_reports_overall_status_idx" ON "validation_reports"("overall_status");
CREATE INDEX "validation_reports_profile_key_idx" ON "validation_reports"("profile_key");

ALTER TABLE "validation_reports" ADD CONSTRAINT "validation_reports_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "validation_reports" ADD CONSTRAINT "validation_reports_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "validation_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "validation_results" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "validator_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "duration_ms" INTEGER NOT NULL,
    "messages" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "validation_results_report_id_sort_order_idx" ON "validation_results"("report_id", "sort_order");
CREATE INDEX "validation_results_validator_name_idx" ON "validation_results"("validator_name");

ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "validation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "validation_evidence_snapshots" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "item_count" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_evidence_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "validation_evidence_snapshots_report_id_key" ON "validation_evidence_snapshots"("report_id");

ALTER TABLE "validation_evidence_snapshots" ADD CONSTRAINT "validation_evidence_snapshots_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "validation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed built-in profiles
INSERT INTO "validation_profiles" ("id", "key", "name", "description", "enabled_validators", "rule_keys", "config", "active", "created_at", "updated_at") VALUES
('vprof_app_testing', 'app_testing', 'App Testing', 'Screenshots, recordings, and step completion for app QA.', '["manifest","evidence","step_completion","timing","rule","execution_context","file_reference","gps","device"]', '["require_image","min_evidence_count"]', '{"minEvidenceCount":1,"minTimeSpentSeconds":30}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vprof_survey', 'survey', 'Survey', 'Text-heavy survey responses with light evidence checks.', '["manifest","evidence","step_completion","timing","rule","execution_context"]', '["require_text","min_evidence_count"]', '{"minEvidenceCount":1,"minTimeSpentSeconds":10}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vprof_ai_labeling', 'ai_labeling', 'AI Labeling', 'JSON/label payloads for dataset annotation tasks.', '["manifest","evidence","step_completion","timing","rule","execution_context","file_reference"]', '["require_json","min_evidence_count"]', '{"minEvidenceCount":1,"minTimeSpentSeconds":5}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vprof_property', 'property_verification', 'Property Verification', 'GPS + image evidence for on-site verification.', '["manifest","evidence","step_completion","timing","rule","execution_context","file_reference","gps","device"]', '["require_image","require_gps","min_evidence_count"]', '{"minEvidenceCount":2,"minTimeSpentSeconds":60,"requireGps":true,"requireDeviceSnapshot":true}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vprof_voice', 'voice_recording', 'Voice Recording', 'Audio evidence and timing for voice collection.', '["manifest","evidence","step_completion","timing","rule","execution_context","file_reference","device"]', '["require_audio","min_evidence_count"]', '{"minEvidenceCount":1,"minTimeSpentSeconds":15}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('vprof_translation', 'translation', 'Translation', 'Text/JSON translation deliverables.', '["manifest","evidence","step_completion","timing","rule","execution_context"]', '["require_text","min_evidence_count"]', '{"minEvidenceCount":1,"minTimeSpentSeconds":20}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RLS (policies later)
ALTER TABLE "validation_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "validation_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "validation_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "validation_evidence_snapshots" ENABLE ROW LEVEL SECURITY;
