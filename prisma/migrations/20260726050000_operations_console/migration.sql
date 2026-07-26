-- Admin & Operations Console

CREATE TABLE "operational_commands" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "command_type" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_public_id" TEXT,
    "queue_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "actor_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "playbook_key" TEXT,
    "reversible" BOOLEAN NOT NULL DEFAULT false,
    "reversed_at" TIMESTAMP(3),
    "reversed_by_user_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),
    CONSTRAINT "operational_commands_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "operational_commands_public_id_key" ON "operational_commands"("public_id");
CREATE UNIQUE INDEX "operational_commands_idempotency_key_key" ON "operational_commands"("idempotency_key");
CREATE INDEX "operational_commands_command_type_created_at_idx" ON "operational_commands"("command_type", "created_at");
CREATE INDEX "operational_commands_target_type_target_id_idx" ON "operational_commands"("target_type", "target_id");
CREATE INDEX "operational_commands_queue_key_status_idx" ON "operational_commands"("queue_key", "status");
CREATE INDEX "operational_commands_actor_user_id_created_at_idx" ON "operational_commands"("actor_user_id", "created_at");
CREATE INDEX "operational_commands_status_idx" ON "operational_commands"("status");
ALTER TABLE "operational_commands" ADD CONSTRAINT "operational_commands_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "operational_audits" (
    "id" TEXT NOT NULL,
    "command_id" TEXT,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "resource_public_id" TEXT,
    "organization_id" TEXT,
    "queue_key" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "operational_audits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "operational_audits_action_created_at_idx" ON "operational_audits"("action", "created_at");
CREATE INDEX "operational_audits_resource_type_resource_id_idx" ON "operational_audits"("resource_type", "resource_id");
CREATE INDEX "operational_audits_resource_public_id_idx" ON "operational_audits"("resource_public_id");
CREATE INDEX "operational_audits_organization_id_created_at_idx" ON "operational_audits"("organization_id", "created_at");
CREATE INDEX "operational_audits_queue_key_created_at_idx" ON "operational_audits"("queue_key", "created_at");
CREATE INDEX "operational_audits_actor_user_id_idx" ON "operational_audits"("actor_user_id");
ALTER TABLE "operational_audits" ADD CONSTRAINT "operational_audits_command_id_fkey"
  FOREIGN KEY ("command_id") REFERENCES "operational_commands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "operational_audits" ADD CONSTRAINT "operational_audits_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "dashboard_snapshots" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dashboard_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "dashboard_snapshots_key_key" ON "dashboard_snapshots"("key");
CREATE INDEX "dashboard_snapshots_generated_at_idx" ON "dashboard_snapshots"("generated_at");

CREATE TABLE "operational_playbooks" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "queue_key" TEXT,
    "summary" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "operational_playbooks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "operational_playbooks_public_id_key" ON "operational_playbooks"("public_id");
CREATE UNIQUE INDEX "operational_playbooks_key_key" ON "operational_playbooks"("key");
CREATE INDEX "operational_playbooks_queue_key_active_idx" ON "operational_playbooks"("queue_key", "active");

INSERT INTO "operational_playbooks" ("id", "public_id", "key", "title", "queue_key", "summary", "steps", "active", "created_at", "updated_at") VALUES
('pbk_notif', 'PBK-000001', 'notification_failure', 'Notification Failure Playbook', 'notification',
 'Standard response for failed or stuck notification jobs.',
 '[{"order":1,"title":"Retry delivery","actionHint":"retry"},{"order":2,"title":"Inspect channel adapter","actionHint":"inspect"},{"order":3,"title":"Switch provider if needed","actionHint":"requeue"},{"order":4,"title":"Escalate to operations","actionHint":"escalate"}]'::jsonb,
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pbk_wdr', 'PBK-000002', 'withdrawal_failure', 'Withdrawal Failure Playbook', 'withdrawal',
 'Verify ledger integrity before retrying payouts.',
 '[{"order":1,"title":"Verify ledger reservation","actionHint":"inspect"},{"order":2,"title":"Inspect withdrawal batch","actionHint":"inspect"},{"order":3,"title":"Retry or cancel request","actionHint":"retry"},{"order":4,"title":"Manual finance review","actionHint":"escalate"}]'::jsonb,
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pbk_pay', 'PBK-000003', 'payment_failure', 'Payment Failure Playbook', 'payment',
 'Normalize provider failures before mutating funding state.',
 '[{"order":1,"title":"Verify webhook / signature","actionHint":"inspect"},{"order":2,"title":"Check provider response snapshot","actionHint":"inspect"},{"order":3,"title":"Replay normalized payment event","actionHint":"retry"},{"order":4,"title":"Escalate finance","actionHint":"escalate"}]'::jsonb,
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pbk_rev', 'PBK-000004', 'review_sla', 'Review SLA Playbook', 'review',
 'Keep review SLAs healthy when queues age.',
 '[{"order":1,"title":"Notify assigned reviewer","actionHint":"retry"},{"order":2,"title":"Reassign queue item","actionHint":"requeue"},{"order":3,"title":"Escalate to senior reviewer","actionHint":"escalate"}]'::jsonb,
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "operational_commands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "operational_audits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dashboard_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "operational_playbooks" ENABLE ROW LEVEL SECURITY;
