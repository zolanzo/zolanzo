-- Campaign Engine

CREATE TYPE "CampaignStatus" AS ENUM (
  'draft',
  'pending_review',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled',
  'archived'
);

CREATE TYPE "CampaignVisibility" AS ENUM (
  'private',
  'organization',
  'platform',
  'public'
);

CREATE TYPE "CampaignPriority" AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TYPE "BudgetModelKind" AS ENUM (
  'fixed',
  'quantity_times_reward'
);

CREATE TYPE "GenerationStrategyKind" AS ENUM (
  'pre_generated',
  'on_demand',
  'batch',
  'streaming',
  'api_driven'
);

CREATE TYPE "ScheduleMode" AS ENUM (
  'immediate',
  'scheduled',
  'recurring_future'
);

CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_user_id" TEXT NOT NULL,
    "task_template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "visibility" "CampaignVisibility" NOT NULL DEFAULT 'organization',
    "priority" "CampaignPriority" NOT NULL DEFAULT 'normal',
    "category" TEXT NOT NULL,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "brief" JSONB NOT NULL,
    "generation_strategy" "GenerationStrategyKind" NOT NULL,
    "generation_config" JSONB,
    "target_quantity" INTEGER NOT NULL,
    "completed_quantity" INTEGER NOT NULL DEFAULT 0,
    "approved_quantity" INTEGER NOT NULL DEFAULT 0,
    "rejected_quantity" INTEGER NOT NULL DEFAULT 0,
    "budget_kind" "BudgetModelKind" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "budget_minor" INTEGER NOT NULL,
    "reserved_budget_minor" INTEGER NOT NULL DEFAULT 0,
    "spent_budget_minor" INTEGER NOT NULL DEFAULT 0,
    "reward_per_unit_minor" INTEGER NOT NULL,
    "reward_strategy_override" JSONB,
    "country_scope" JSONB NOT NULL DEFAULT '[]',
    "language_scope" JSONB NOT NULL DEFAULT '[]',
    "device_scope" JSONB NOT NULL DEFAULT '[]',
    "audience_constraints" JSONB NOT NULL DEFAULT '[]',
    "schedule_mode" "ScheduleMode" NOT NULL DEFAULT 'immediate',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "recurrence_rule" TEXT,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "cloned_from_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "campaigns_public_id_key" ON "campaigns"("public_id");
CREATE UNIQUE INDEX "campaigns_organization_id_slug_key" ON "campaigns"("organization_id", "slug");
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns"("organization_id");
CREATE INDEX "campaigns_client_user_id_idx" ON "campaigns"("client_user_id");
CREATE INDEX "campaigns_task_template_id_idx" ON "campaigns"("task_template_id");
CREATE INDEX "campaigns_category_idx" ON "campaigns"("category");
CREATE INDEX "campaigns_start_at_idx" ON "campaigns"("start_at");
CREATE INDEX "campaigns_generation_strategy_idx" ON "campaigns"("generation_strategy");

ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_client_user_id_fkey"
  FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_task_template_id_fkey"
  FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_updated_by_user_id_fkey"
  FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_cloned_from_id_fkey"
  FOREIGN KEY ("cloned_from_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaigns" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "campaigns" IS 'RLS: org-scoped business contracts; drafts editable by creators until published';
