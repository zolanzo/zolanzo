-- Notification Hub

CREATE TABLE "delivery_policies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "organization_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "delivery_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "delivery_policies_key_key" ON "delivery_policies"("key");
CREATE INDEX "delivery_policies_organization_id_active_idx" ON "delivery_policies"("organization_id", "active");
CREATE INDEX "delivery_policies_mode_idx" ON "delivery_policies"("mode");
ALTER TABLE "delivery_policies" ADD CONSTRAINT "delivery_policies_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT,
    "body_text" TEXT NOT NULL,
    "body_html" TEXT,
    "required_variables" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_templates_key_channel_locale_version_key"
  ON "notification_templates"("key", "channel", "locale", "version");
CREATE INDEX "notification_templates_event_channel_active_idx"
  ON "notification_templates"("event", "channel", "active");

CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "subject_key" TEXT NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "enabled_channels" JSONB NOT NULL,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "event_subscriptions" JSONB,
    "digest_frequency" TEXT NOT NULL DEFAULT 'none',
    "dnd_windows" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_preferences_subject_key_key" ON "notification_preferences"("subject_key");
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");
CREATE INDEX "notification_preferences_organization_id_idx" ON "notification_preferences"("organization_id");
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_intents" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "organization_id" TEXT,
    "actor_user_id" TEXT,
    "template_key" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "recipient_snapshot" JSONB NOT NULL,
    "policy_snapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_intents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_intents_public_id_key" ON "notification_intents"("public_id");
CREATE UNIQUE INDEX "notification_intents_idempotency_key_key" ON "notification_intents"("idempotency_key");
CREATE INDEX "notification_intents_organization_id_status_idx" ON "notification_intents"("organization_id", "status");
CREATE INDEX "notification_intents_event_created_at_idx" ON "notification_intents"("event", "created_at");
CREATE INDEX "notification_intents_status_idx" ON "notification_intents"("status");
ALTER TABLE "notification_intents" ADD CONSTRAINT "notification_intents_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_intents" ADD CONSTRAINT "notification_intents_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "notification_jobs" (
    "id" TEXT NOT NULL,
    "intent_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "provider_key" TEXT,
    "recipient_user_id" TEXT,
    "recipient_address" TEXT NOT NULL,
    "recipient_role" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "failure_details" JSONB,
    "provider_ref" TEXT,
    "rendered_subject" TEXT,
    "rendered_body_text" TEXT NOT NULL,
    "rendered_body_html" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notification_jobs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "notification_jobs_idempotency_key_key" ON "notification_jobs"("idempotency_key");
CREATE INDEX "notification_jobs_intent_id_idx" ON "notification_jobs"("intent_id");
CREATE INDEX "notification_jobs_status_scheduled_at_idx" ON "notification_jobs"("status", "scheduled_at");
CREATE INDEX "notification_jobs_channel_status_idx" ON "notification_jobs"("channel", "status");
CREATE INDEX "notification_jobs_recipient_user_id_idx" ON "notification_jobs"("recipient_user_id");
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_intent_id_fkey"
  FOREIGN KEY ("intent_id") REFERENCES "notification_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_recipient_user_id_fkey"
  FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default delivery policies
INSERT INTO "delivery_policies" ("id", "key", "display_name", "mode", "config", "organization_id", "active", "created_at", "updated_at") VALUES
('dpol_immediate', 'immediate', 'Immediate', 'immediate', '{"mode":"immediate"}'::jsonb, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dpol_delayed_5m', 'delayed_5m', 'Delayed 5 minutes', 'delayed', '{"mode":"delayed","delaySeconds":300}'::jsonb, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dpol_quiet_hours', 'quiet_hours_default', 'Quiet hours (22:00–07:00)', 'quiet_hours', '{"mode":"quiet_hours","quietHours":{"start":"22:00","end":"07:00"},"retry":{"maxAttempts":3,"backoffSeconds":60}}'::jsonb, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dpol_digest_daily', 'digest_daily', 'Daily digest (future)', 'digest', '{"mode":"digest","digestFrequency":"daily"}'::jsonb, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "delivery_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_intents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_jobs" ENABLE ROW LEVEL SECURITY;
