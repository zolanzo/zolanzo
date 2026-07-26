-- Assignment Workspace & Execution Engine

ALTER TABLE "assignments"
  ALTER COLUMN "status" SET DEFAULT 'assigned',
  ADD COLUMN "execution_context" JSONB,
  ADD COLUMN "progress_percent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "estimated_remaining_min" INTEGER,
  ADD COLUMN "last_activity_at" TIMESTAMP(3),
  ADD COLUMN "paused_at" TIMESTAMP(3);

CREATE TYPE "AssignmentStepStatus" AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'skipped',
  'failed'
);

CREATE TABLE "execution_steps" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "step_key" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "conditional_key" TEXT,
    "depends_on_step_keys" JSONB NOT NULL DEFAULT '[]',
    "estimated_duration_min" INTEGER,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "execution_steps_assignment_id_step_key_key" ON "execution_steps"("assignment_id", "step_key");
CREATE UNIQUE INDEX "execution_steps_assignment_id_sequence_key" ON "execution_steps"("assignment_id", "sequence");
CREATE INDEX "execution_steps_assignment_id_idx" ON "execution_steps"("assignment_id");

ALTER TABLE "execution_steps" ADD CONSTRAINT "execution_steps_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "assignment_steps" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "execution_step_id" TEXT NOT NULL,
    "status" "AssignmentStepStatus" NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "skip_reason" TEXT,
    "fail_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assignment_steps_execution_step_id_key" ON "assignment_steps"("execution_step_id");
CREATE INDEX "assignment_steps_assignment_id_status_idx" ON "assignment_steps"("assignment_id", "status");

ALTER TABLE "assignment_steps" ADD CONSTRAINT "assignment_steps_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_steps" ADD CONSTRAINT "assignment_steps_execution_step_id_fkey"
  FOREIGN KEY ("execution_step_id") REFERENCES "execution_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "assignment_timeline_events" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_timeline_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assignment_timeline_events_assignment_id_created_at_idx"
  ON "assignment_timeline_events"("assignment_id", "created_at");
CREATE INDEX "assignment_timeline_events_event_type_idx"
  ON "assignment_timeline_events"("event_type");

ALTER TABLE "assignment_timeline_events" ADD CONSTRAINT "assignment_timeline_events_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "AssignmentNoteVisibility" AS ENUM (
  'worker_private',
  'reviewer_placeholder'
);

CREATE TABLE "assignment_notes" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "visibility" "AssignmentNoteVisibility" NOT NULL DEFAULT 'worker_private',
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "assignment_notes_assignment_id_created_at_idx"
  ON "assignment_notes"("assignment_id", "created_at");
CREATE INDEX "assignment_notes_author_user_id_idx"
  ON "assignment_notes"("author_user_id");

ALTER TABLE "assignment_notes" ADD CONSTRAINT "assignment_notes_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assignment_notes" ADD CONSTRAINT "assignment_notes_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "execution_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_timeline_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_notes" ENABLE ROW LEVEL SECURITY;
