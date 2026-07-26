-- Task Template Engine

CREATE TYPE "TemplateStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "TemplateVisibility" AS ENUM ('private', 'organization', 'platform', 'public');
CREATE TYPE "TemplateDifficulty" AS ENUM ('easy', 'medium', 'hard', 'expert');

CREATE TABLE "task_templates" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "difficulty" "TemplateDifficulty" NOT NULL DEFAULT 'medium',
    "estimated_duration_min" INTEGER,
    "capability_set" JSONB NOT NULL,
    "required_evidence" JSONB NOT NULL,
    "submission_schema" JSONB NOT NULL,
    "validation_rules" JSONB NOT NULL,
    "review_rules" JSONB NOT NULL,
    "reward_strategy" JSONB NOT NULL,
    "constraints" JSONB NOT NULL DEFAULT '[]',
    "supported_platforms" JSONB NOT NULL DEFAULT '[]',
    "supported_devices" JSONB NOT NULL DEFAULT '[]',
    "supported_countries" JSONB NOT NULL DEFAULT '[]',
    "supported_languages" JSONB NOT NULL DEFAULT '[]',
    "required_skills" JSONB NOT NULL DEFAULT '[]',
    "visibility" "TemplateVisibility" NOT NULL DEFAULT 'platform',
    "status" "TemplateStatus" NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "previous_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_templates_public_id_key" ON "task_templates"("public_id");
CREATE UNIQUE INDEX "task_templates_template_key_version_key" ON "task_templates"("template_key", "version");
CREATE INDEX "task_templates_status_idx" ON "task_templates"("status");
CREATE INDEX "task_templates_category_idx" ON "task_templates"("category");
CREATE INDEX "task_templates_visibility_idx" ON "task_templates"("visibility");
CREATE INDEX "task_templates_slug_idx" ON "task_templates"("slug");

ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "task_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "task_templates" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "task_templates" IS 'RLS: platform/org visibility; drafts owner-only until published';
