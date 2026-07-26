-- Withdrawal Engine

CREATE TABLE "withdrawal_policies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "approval_mode" TEXT NOT NULL,
    "approval_threshold_minor" INTEGER,
    "batch_mode" TEXT NOT NULL DEFAULT 'none',
    "min_amount_minor" INTEGER NOT NULL,
    "max_amount_minor" INTEGER,
    "minimum_balance_minor" INTEGER NOT NULL DEFAULT 0,
    "cooling_period_hours" INTEGER NOT NULL DEFAULT 0,
    "requires_verified_destination" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawal_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_policies_key_key" ON "withdrawal_policies"("key");

CREATE TABLE "destination_accounts" (
    "id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "destination_accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "destination_accounts_worker_user_id_active_idx" ON "destination_accounts"("worker_user_id", "active");
CREATE INDEX "destination_accounts_kind_idx" ON "destination_accounts"("kind");
ALTER TABLE "destination_accounts" ADD CONSTRAINT "destination_accounts_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "withdrawal_batches" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "currency" TEXT NOT NULL,
    "batch_mode" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "total_minor" INTEGER NOT NULL DEFAULT 0,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "processing_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "reconciled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdrawal_batches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_batches_public_id_key" ON "withdrawal_batches"("public_id");
CREATE UNIQUE INDEX "withdrawal_batches_batch_mode_period_key_currency_key" ON "withdrawal_batches"("batch_mode", "period_key", "currency");
CREATE INDEX "withdrawal_batches_status_idx" ON "withdrawal_batches"("status");

CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "wallet_id" TEXT NOT NULL,
    "destination_account_id" TEXT NOT NULL,
    "policy_key" TEXT NOT NULL,
    "policy_id" TEXT,
    "policy_snapshot" JSONB NOT NULL,
    "projection_snapshot" JSONB NOT NULL,
    "compliance_snapshot" JSONB NOT NULL,
    "settlement_references" JSONB NOT NULL DEFAULT '[]',
    "amount_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL DEFAULT 0,
    "net_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "batch_id" TEXT,
    "ledger_transaction_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "processing_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_requests_public_id_key" ON "withdrawal_requests"("public_id");
CREATE UNIQUE INDEX "withdrawal_requests_idempotency_key_key" ON "withdrawal_requests"("idempotency_key");
CREATE INDEX "withdrawal_requests_worker_user_id_status_idx" ON "withdrawal_requests"("worker_user_id", "status");
CREATE INDEX "withdrawal_requests_status_scheduled_at_idx" ON "withdrawal_requests"("status", "scheduled_at");
CREATE INDEX "withdrawal_requests_batch_id_idx" ON "withdrawal_requests"("batch_id");
CREATE INDEX "withdrawal_requests_wallet_id_idx" ON "withdrawal_requests"("wallet_id");

ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_destination_account_id_fkey"
  FOREIGN KEY ("destination_account_id") REFERENCES "destination_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "withdrawal_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "withdrawal_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "withdrawal_intents" (
    "id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "destination_account_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "amount_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL DEFAULT 0,
    "net_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "policy_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "eligibility_snapshot" JSONB NOT NULL,
    "projection_snapshot" JSONB NOT NULL,
    "estimated_process_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "converted_request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "withdrawal_intents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_intents_converted_request_id_key" ON "withdrawal_intents"("converted_request_id");
CREATE INDEX "withdrawal_intents_worker_user_id_status_idx" ON "withdrawal_intents"("worker_user_id", "status");
CREATE INDEX "withdrawal_intents_expires_at_idx" ON "withdrawal_intents"("expires_at");

ALTER TABLE "withdrawal_intents" ADD CONSTRAINT "withdrawal_intents_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_intents" ADD CONSTRAINT "withdrawal_intents_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_intents" ADD CONSTRAINT "withdrawal_intents_destination_account_id_fkey"
  FOREIGN KEY ("destination_account_id") REFERENCES "destination_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "withdrawal_intents" ADD CONSTRAINT "withdrawal_intents_converted_request_id_fkey"
  FOREIGN KEY ("converted_request_id") REFERENCES "withdrawal_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "withdrawal_reservations" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "withdrawal_reservations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "withdrawal_reservations_request_id_key" ON "withdrawal_reservations"("request_id");
CREATE INDEX "withdrawal_reservations_wallet_id_status_idx" ON "withdrawal_reservations"("wallet_id", "status");
ALTER TABLE "withdrawal_reservations" ADD CONSTRAINT "withdrawal_reservations_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "withdrawal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_reservations" ADD CONSTRAINT "withdrawal_reservations_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "withdrawal_approvals" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "comments" TEXT,
    "metadata" JSONB,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "withdrawal_approvals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "withdrawal_approvals_request_id_step_idx" ON "withdrawal_approvals"("request_id", "step");
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_request_id_fkey"
  FOREIGN KEY ("request_id") REFERENCES "withdrawal_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawal_approvals" ADD CONSTRAINT "withdrawal_approvals_approver_user_id_fkey"
  FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "withdrawal_policies" ("id", "key", "name", "description", "approval_mode", "approval_threshold_minor", "batch_mode", "min_amount_minor", "max_amount_minor", "minimum_balance_minor", "cooling_period_hours", "requires_verified_destination", "active", "created_at", "updated_at") VALUES
('wpol_immediate', 'immediate', 'Immediate', 'Auto-approve and schedule for processing when eligible.', 'automatic', NULL, 'none', 10000, NULL, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_manual', 'manual_approval', 'Manual Approval', 'Every withdrawal requires finance approval.', 'manual', NULL, 'none', 10000, NULL, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_threshold', 'threshold_approval', 'Threshold Approval', 'Auto-approve below threshold; manual above.', 'threshold', 5000000, 'none', 10000, NULL, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_batch', 'scheduled_batch', 'Scheduled Batch', 'Approved withdrawals join the next payout batch.', 'automatic', NULL, 'daily', 10000, NULL, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_daily', 'daily_window', 'Daily Window', 'Batch once per UTC day.', 'automatic', NULL, 'daily', 10000, 50000000, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_weekly', 'weekly_window', 'Weekly Window', 'Batch once per UTC week.', 'automatic', NULL, 'weekly', 10000, 100000000, 0, 24, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_minbal', 'minimum_balance', 'Minimum Balance', 'Require a residual available balance after withdrawal.', 'automatic', NULL, 'none', 10000, NULL, 50000, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_max', 'maximum_amount', 'Maximum Amount', 'Cap single withdrawal amount.', 'manual', NULL, 'none', 10000, 10000000, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('wpol_cool', 'cooling_period', 'Cooling Period', 'Enforce hours between completed withdrawals.', 'automatic', NULL, 'none', 10000, NULL, 0, 48, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "withdrawal_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "destination_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_intents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "withdrawal_batches" ENABLE ROW LEVEL SECURITY;
