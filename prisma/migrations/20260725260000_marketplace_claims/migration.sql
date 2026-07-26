-- Marketplace: reservations, assignments, claim policies

ALTER TABLE "campaigns"
  ADD COLUMN "claim_policies" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "reservation_timeout_seconds" INTEGER NOT NULL DEFAULT 120;

CREATE TYPE "ReservationStatus" AS ENUM (
  'pending',
  'confirmed',
  'expired',
  'released',
  'converted'
);

CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "task_instance_id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'pending',
    "timeout_seconds" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reservations_task_instance_id_status_idx" ON "reservations"("task_instance_id", "status");
CREATE INDEX "reservations_worker_user_id_status_idx" ON "reservations"("worker_user_id", "status");
CREATE INDEX "reservations_campaign_id_idx" ON "reservations"("campaign_id");
CREATE INDEX "reservations_expires_at_idx" ON "reservations"("expires_at");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_task_instance_id_fkey"
  FOREIGN KEY ("task_instance_id") REFERENCES "task_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "AssignmentPriority" AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "task_instance_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "task_template_id" TEXT NOT NULL,
    "task_template_version" INTEGER NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'claimed',
    "priority" "AssignmentPriority" NOT NULL DEFAULT 'normal',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assignments_public_id_key" ON "assignments"("public_id");
CREATE UNIQUE INDEX "assignments_task_instance_id_key" ON "assignments"("task_instance_id");
CREATE UNIQUE INDEX "assignments_reservation_id_key" ON "assignments"("reservation_id");
CREATE INDEX "assignments_campaign_id_status_idx" ON "assignments"("campaign_id", "status");
CREATE INDEX "assignments_worker_user_id_status_idx" ON "assignments"("worker_user_id", "status");
CREATE INDEX "assignments_status_idx" ON "assignments"("status");
CREATE INDEX "assignments_created_at_idx" ON "assignments"("created_at");

ALTER TABLE "assignments" ADD CONSTRAINT "assignments_task_instance_id_fkey"
  FOREIGN KEY ("task_instance_id") REFERENCES "task_instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_task_template_id_fkey"
  FOREIGN KEY ("task_template_id") REFERENCES "task_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_reservation_id_fkey"
  FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE "reservations" IS 'Temporary claim holds; marketplace never lists reserved inventory';
COMMENT ON TABLE "assignments" IS 'One worker ↔ one Task Instance execution binding';
