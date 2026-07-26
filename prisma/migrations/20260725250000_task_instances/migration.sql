-- Task Instance Generator + Campaign generation policies

CREATE TYPE "GenerationPolicyKind" AS ENUM (
  'fixed_quantity',
  'rolling_window',
  'demand_buffer',
  'scheduled_batch',
  'api_controlled'
);

ALTER TABLE "campaigns"
  ADD COLUMN "generation_policy" "GenerationPolicyKind" NOT NULL DEFAULT 'fixed_quantity',
  ADD COLUMN "generation_policy_config" JSONB;

CREATE TYPE "TaskInstanceStatus" AS ENUM (
  'generated',
  'available',
  'reserved',
  'claimed',
  'expired',
  'cancelled',
  'completed'
);

CREATE TYPE "TaskInstancePriority" AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TABLE "task_instances" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "task_template_id" TEXT NOT NULL,
    "task_template_version" INTEGER NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "generation_strategy" "GenerationStrategyKind" NOT NULL,
    "generation_policy" "GenerationPolicyKind" NOT NULL,
    "generation_policy_config" JSONB,
    "status" "TaskInstanceStatus" NOT NULL DEFAULT 'generated',
    "priority" "TaskInstancePriority" NOT NULL DEFAULT 'normal',
    "reserved" BOOLEAN NOT NULL DEFAULT false,
    "reserved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "campaign_public_id" TEXT NOT NULL,
    "template_public_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "task_instances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "task_instances_public_id_key" ON "task_instances"("public_id");
CREATE UNIQUE INDEX "task_instances_campaign_id_sequence_number_key" ON "task_instances"("campaign_id", "sequence_number");
CREATE INDEX "task_instances_status_idx" ON "task_instances"("status");
CREATE INDEX "task_instances_campaign_id_status_idx" ON "task_instances"("campaign_id", "status");
CREATE INDEX "task_instances_task_template_id_idx" ON "task_instances"("task_template_id");
CREATE INDEX "task_instances_expires_at_idx" ON "task_instances"("expires_at");
CREATE INDEX "task_instances_reserved_idx" ON "task_instances"("reserved");
CREATE INDEX "task_instances_generation_strategy_idx" ON "task_instances"("generation_strategy");
CREATE INDEX "task_instances_generation_policy_idx" ON "task_instances"("generation_policy");

ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_instances" ADD CONSTRAINT "task_instances_task_template_id_fkey"
  FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "task_instances" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "task_instances" IS 'Immutable marketplace inventory; Assignments created later on claim';
