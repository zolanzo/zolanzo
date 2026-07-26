-- AI Plugin Platform

CREATE TABLE "ai_plugins" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "supported_entity_types" JSONB NOT NULL,
    "supported_extension_points" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "health" TEXT NOT NULL DEFAULT 'stub',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "configuration_schema" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_plugins_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_plugins_key_key" ON "ai_plugins"("key");
CREATE INDEX "ai_plugins_active_priority_idx" ON "ai_plugins"("active", "priority");
CREATE INDEX "ai_plugins_health_idx" ON "ai_plugins"("health");

CREATE TABLE "ai_configurations" (
    "id" TEXT NOT NULL,
    "subject_key" TEXT NOT NULL,
    "organization_id" TEXT,
    "extension_point" TEXT NOT NULL,
    "policy_mode" TEXT NOT NULL DEFAULT 'recommendation_only',
    "plugin_key" TEXT,
    "required_capabilities" JSONB,
    "config" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_configurations_subject_key_key" ON "ai_configurations"("subject_key");
CREATE INDEX "ai_configurations_extension_point_active_idx" ON "ai_configurations"("extension_point", "active");
CREATE INDEX "ai_configurations_organization_id_idx" ON "ai_configurations"("organization_id");
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_plugin_key_fkey"
  FOREIGN KEY ("plugin_key") REFERENCES "ai_plugins"("key") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ai_executions" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "plugin_key" TEXT NOT NULL,
    "extension_point" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_public_id" TEXT,
    "organization_id" TEXT,
    "actor_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "policy_mode" TEXT NOT NULL,
    "context_snapshot" JSONB NOT NULL,
    "result" JSONB,
    "model" TEXT,
    "model_version" TEXT,
    "confidence" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "recommendation" TEXT,
    "duration_ms" INTEGER,
    "idempotency_key" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "ai_executions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_executions_public_id_key" ON "ai_executions"("public_id");
CREATE UNIQUE INDEX "ai_executions_idempotency_key_key" ON "ai_executions"("idempotency_key");
CREATE INDEX "ai_executions_plugin_key_created_at_idx" ON "ai_executions"("plugin_key", "created_at");
CREATE INDEX "ai_executions_extension_point_status_idx" ON "ai_executions"("extension_point", "status");
CREATE INDEX "ai_executions_entity_type_entity_id_idx" ON "ai_executions"("entity_type", "entity_id");
CREATE INDEX "ai_executions_organization_id_created_at_idx" ON "ai_executions"("organization_id", "created_at");
CREATE INDEX "ai_executions_status_idx" ON "ai_executions"("status");
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_plugin_key_fkey"
  FOREIGN KEY ("plugin_key") REFERENCES "ai_plugins"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ai_recommendations" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "score" DOUBLE PRECISION,
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "evidence_references" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_recommendations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ai_recommendations_execution_id_idx" ON "ai_recommendations"("execution_id");
CREATE INDEX "ai_recommendations_kind_idx" ON "ai_recommendations"("kind");
ALTER TABLE "ai_recommendations" ADD CONSTRAINT "ai_recommendations_execution_id_fkey"
  FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_decision_records" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "organization_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_public_id" TEXT,
    "extension_point" TEXT NOT NULL,
    "final_decision" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "evidence_references" JSONB NOT NULL,
    "rationale" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_decision_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ai_decision_records_public_id_key" ON "ai_decision_records"("public_id");
CREATE INDEX "ai_decision_records_entity_type_entity_id_idx" ON "ai_decision_records"("entity_type", "entity_id");
CREATE INDEX "ai_decision_records_actor_user_id_created_at_idx" ON "ai_decision_records"("actor_user_id", "created_at");
CREATE INDEX "ai_decision_records_organization_id_created_at_idx" ON "ai_decision_records"("organization_id", "created_at");
CREATE INDEX "ai_decision_records_extension_point_created_at_idx" ON "ai_decision_records"("extension_point", "created_at");
ALTER TABLE "ai_decision_records" ADD CONSTRAINT "ai_decision_records_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_decision_records" ADD CONSTRAINT "ai_decision_records_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ai_decision_recommendations" (
    "decision_id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    CONSTRAINT "ai_decision_recommendations_pkey" PRIMARY KEY ("decision_id", "recommendation_id")
);
ALTER TABLE "ai_decision_recommendations" ADD CONSTRAINT "ai_decision_recommendations_decision_id_fkey"
  FOREIGN KEY ("decision_id") REFERENCES "ai_decision_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_decision_recommendations" ADD CONSTRAINT "ai_decision_recommendations_recommendation_id_fkey"
  FOREIGN KEY ("recommendation_id") REFERENCES "ai_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_decision_recommendations" ADD CONSTRAINT "ai_decision_recommendations_execution_id_fkey"
  FOREIGN KEY ("execution_id") REFERENCES "ai_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ai_plugins" ("id", "key", "display_name", "version", "capabilities", "supported_entity_types", "supported_extension_points", "priority", "health", "active", "configuration_schema", "created_at", "updated_at") VALUES
('aip_memory', 'memory', 'Memory Plugin', '1.0.0', '["evidence_quality","fraud_detection","duplicate_detection","risk_scoring","reviewer_assistance","queue_routing","moderation_assistance","prompt_generation","translation_assistance"]'::jsonb, '["submission","validation_report","review_queue_item","settlement","withdrawal","notification_intent","operational_command","user","campaign"]'::jsonb, '["submission","validation","review","settlement","withdrawal","notifications","operations"]'::jsonb, 0, 'healthy', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_eq', 'evidence_quality', 'Evidence Quality', '0.1.0', '["evidence_quality"]'::jsonb, '["submission"]'::jsonb, '["submission","validation","review"]'::jsonb, 10, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_fraud', 'fraud_detection', 'Fraud Detection', '0.1.0', '["fraud_detection"]'::jsonb, '["submission","user"]'::jsonb, '["submission","validation","review","operations"]'::jsonb, 20, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_dup', 'duplicate_detection', 'Duplicate Detection', '0.1.0', '["duplicate_detection"]'::jsonb, '["submission"]'::jsonb, '["submission","validation"]'::jsonb, 30, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_risk', 'risk_scoring', 'Risk Scoring', '0.1.0', '["risk_scoring"]'::jsonb, '["submission","withdrawal","user"]'::jsonb, '["review","withdrawal","operations"]'::jsonb, 40, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_rev', 'reviewer_assistance', 'Reviewer Assistance', '0.1.0', '["reviewer_assistance"]'::jsonb, '["review_queue_item","submission"]'::jsonb, '["review"]'::jsonb, 50, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_route', 'queue_routing', 'Queue Routing', '0.1.0', '["queue_routing"]'::jsonb, '["review_queue_item","operational_command"]'::jsonb, '["review","operations"]'::jsonb, 60, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_mod', 'moderation_assistance', 'Moderation Assistance', '0.1.0', '["moderation_assistance"]'::jsonb, '["user","submission"]'::jsonb, '["operations","review"]'::jsonb, 70, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_tr', 'translation_assistance', 'Translation Assistance', '0.1.0', '["translation_assistance"]'::jsonb, '["submission","notification_intent"]'::jsonb, '["submission","notifications"]'::jsonb, 80, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_prompt', 'prompt_generation', 'Prompt Generation', '0.1.0', '["prompt_generation"]'::jsonb, '["submission","review_queue_item"]'::jsonb, '["validation","review"]'::jsonb, 90, 'stub', true, '{"type":"object"}'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "ai_configurations" ("id", "subject_key", "organization_id", "extension_point", "policy_mode", "plugin_key", "required_capabilities", "config", "active", "created_at", "updated_at") VALUES
('aic_review', 'global:review', NULL, 'review', 'recommendation_only', NULL, '["reviewer_assistance"]'::jsonb, '{}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_validation', 'global:validation', NULL, 'validation', 'recommendation_only', NULL, '["evidence_quality"]'::jsonb, '{}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_disabled_auto', 'global:settlement', NULL, 'settlement', 'disabled', NULL, '["risk_scoring"]'::jsonb, '{}'::jsonb, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "ai_plugins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_executions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_decision_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_decision_recommendations" ENABLE ROW LEVEL SECURITY;
