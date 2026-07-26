-- Review Engine: policies, queue, assignments, decisions, findings

CREATE TABLE "review_policies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mode" TEXT NOT NULL,
    "config" JSONB,
    "downstream_actions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "review_policies_key_key" ON "review_policies"("key");

CREATE TABLE "review_queue_items" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "validation_report_id" TEXT NOT NULL,
    "policy_key" TEXT NOT NULL,
    "policy_id" TEXT,
    "policy_snapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lifecycle_status" TEXT NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assigned_reviewer_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_queue_items_status_priority_created_at_idx" ON "review_queue_items"("status", "priority", "created_at");
CREATE INDEX "review_queue_items_submission_id_idx" ON "review_queue_items"("submission_id");
CREATE INDEX "review_queue_items_assigned_reviewer_id_status_idx" ON "review_queue_items"("assigned_reviewer_id", "status");
CREATE INDEX "review_queue_items_lifecycle_status_idx" ON "review_queue_items"("lifecycle_status");

ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_validation_report_id_fkey"
  FOREIGN KEY ("validation_report_id") REFERENCES "validation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "review_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "review_queue_items" ADD CONSTRAINT "review_queue_items_assigned_reviewer_id_fkey"
  FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "review_assignments" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_assignments_queue_item_id_idx" ON "review_assignments"("queue_item_id");
CREATE INDEX "review_assignments_reviewer_user_id_idx" ON "review_assignments"("reviewer_user_id");
CREATE UNIQUE INDEX "review_assignments_queue_item_id_reviewer_user_id_role_key" ON "review_assignments"("queue_item_id", "reviewer_user_id", "role");

ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_queue_item_id_fkey"
  FOREIGN KEY ("queue_item_id") REFERENCES "review_queue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_reviewer_user_id_fkey"
  FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "review_decisions" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "validation_report_id" TEXT NOT NULL,
    "queue_item_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT,
    "review_mode" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "duration_ms" INTEGER,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,
    "requested_revisions" JSONB,
    "policy_snapshot" JSONB NOT NULL,
    "metadata" JSONB,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_decisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "review_decisions_public_id_key" ON "review_decisions"("public_id");
CREATE INDEX "review_decisions_submission_id_decided_at_idx" ON "review_decisions"("submission_id", "decided_at");
CREATE INDEX "review_decisions_outcome_idx" ON "review_decisions"("outcome");
CREATE INDEX "review_decisions_reviewer_user_id_idx" ON "review_decisions"("reviewer_user_id");
CREATE INDEX "review_decisions_queue_item_id_idx" ON "review_decisions"("queue_item_id");

ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_validation_report_id_fkey"
  FOREIGN KEY ("validation_report_id") REFERENCES "validation_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_queue_item_id_fkey"
  FOREIGN KEY ("queue_item_id") REFERENCES "review_queue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_reviewer_user_id_fkey"
  FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "review_findings" (
    "id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "assignment_step_key" TEXT,
    "evidence_item_id" TEXT,
    "validator_result_id" TEXT,
    "message" TEXT NOT NULL,
    "recommendation" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_findings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_findings_decision_id_idx" ON "review_findings"("decision_id");
CREATE INDEX "review_findings_category_severity_idx" ON "review_findings"("category", "severity");

ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_decision_id_fkey"
  FOREIGN KEY ("decision_id") REFERENCES "review_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed review policies
INSERT INTO "review_policies" ("id", "key", "name", "description", "mode", "config", "downstream_actions", "active", "created_at", "updated_at") VALUES
('rpol_auto', 'auto_approve_high_score', 'Auto-approve high score', 'Automatically approve when validation passes with score ≥ threshold.', 'automatic', '{"autoApproveMinScore":90,"requireNoFailures":true}', '{"approved":["release_escrow","credit_wallet","notify_worker"],"rejected":["refund_escrow","notify_worker"],"revision_requested":["reopen_assignment","notify_worker"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rpol_human', 'always_human', 'Always human review', 'Every submission requires a human reviewer decision.', 'human', '{}', '{"approved":["release_escrow","credit_wallet"],"approved_with_warning":["release_escrow","credit_wallet","notify_client"],"rejected":["refund_escrow"],"revision_requested":["reopen_assignment","notify_worker"],"escalated":["notify_client"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rpol_audit', 'random_audit', 'Random quality audit', 'Auto-approve most passing submissions; sample a percentage for human review.', 'human', '{"autoApproveMinScore":80,"requireNoFailures":true,"samplingRate":0.05}', '{"approved":["release_escrow","credit_wallet"],"revision_requested":["reopen_assignment"],"rejected":["refund_escrow"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rpol_two', 'two_reviewers', 'Two independent reviewers', 'Requires two human reviewers before a final decision.', 'two_person', '{"reviewerCount":2}', '{"approved":["release_escrow","credit_wallet"],"rejected":["refund_escrow"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rpol_senior', 'senior_after_rejection', 'Senior after rejection', 'Escalate to a senior reviewer after a rejection decision.', 'escalation', '{}', '{"rejected":["notify_client"],"escalated":["notify_client"],"approved":["release_escrow","credit_wallet"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rpol_customer', 'customer_before_approval', 'Customer review before approval', 'Client must confirm before final approval (future wiring).', 'customer_future', '{}', '{"approved":["release_escrow","credit_wallet","notify_client"],"deferred":["notify_client"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('rpol_high', 'escalate_high_value', 'Escalate high-value', 'High-reward submissions escalate automatically.', 'escalation', '{"highValueThresholdMinor":50000}', '{"escalated":["notify_client"],"approved":["release_escrow","credit_wallet"]}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "review_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_queue_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_decisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "review_findings" ENABLE ROW LEVEL SECURITY;
