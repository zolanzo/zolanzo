-- Submission Package & Evidence Engine

CREATE TYPE "ManifestEvidenceKind" AS ENUM (
  'image',
  'video',
  'audio',
  'file',
  'gps',
  'json',
  'link',
  'text',
  'screen_recording'
);

CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "execution_context_snapshot" JSONB NOT NULL,
    "device_snapshot" JSONB,
    "gps_snapshot" JSONB,
    "timing_metrics" JSONB,
    "ready_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submissions_public_id_key" ON "submissions"("public_id");
CREATE INDEX "submissions_assignment_id_status_idx" ON "submissions"("assignment_id", "status");
CREATE INDEX "submissions_worker_user_id_status_idx" ON "submissions"("worker_user_id", "status");
CREATE INDEX "submissions_status_idx" ON "submissions"("status");
CREATE INDEX "submissions_submitted_at_idx" ON "submissions"("submitted_at");

ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "evidence_manifests" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_manifests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evidence_manifests_submission_id_key" ON "evidence_manifests"("submission_id");

ALTER TABLE "evidence_manifests" ADD CONSTRAINT "evidence_manifests_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "evidence_items" (
    "id" TEXT NOT NULL,
    "manifest_id" TEXT NOT NULL,
    "kind" "ManifestEvidenceKind" NOT NULL,
    "label" TEXT NOT NULL,
    "step_key" TEXT,
    "reference" JSONB NOT NULL,
    "content_hash" TEXT,
    "size_bytes" INTEGER,
    "inline_payload" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "replaced_at" TIMESTAMP(3),

    CONSTRAINT "evidence_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "evidence_items_manifest_id_kind_idx" ON "evidence_items"("manifest_id", "kind");
CREATE INDEX "evidence_items_step_key_idx" ON "evidence_items"("step_key");

ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_manifest_id_fkey"
  FOREIGN KEY ("manifest_id") REFERENCES "evidence_manifests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "submission_summaries" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "time_spent_seconds" INTEGER,
    "completed_steps" INTEGER NOT NULL,
    "required_steps" INTEGER NOT NULL,
    "required_completed" INTEGER NOT NULL,
    "evidence_counts" JSONB NOT NULL,
    "execution_metrics" JSONB NOT NULL,
    "worker_notes_summary" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_summaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submission_summaries_submission_id_key" ON "submission_summaries"("submission_id");

ALTER TABLE "submission_summaries" ADD CONSTRAINT "submission_summaries_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evidence_manifests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "evidence_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submission_summaries" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE "submissions" IS 'Immutable Submission Packages after submit; evidence via adapter references';
COMMENT ON TABLE "evidence_items" IS 'EvidenceReference only — never vendor-specific storage URLs in business logic';
