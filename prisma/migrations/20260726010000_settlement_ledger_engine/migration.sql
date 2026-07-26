-- Settlement, Escrow & Ledger Engine

CREATE TABLE "settlement_policies" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hold_days" INTEGER NOT NULL DEFAULT 0,
    "requires_manual_approval" BOOLEAN NOT NULL DEFAULT false,
    "batch_mode" TEXT NOT NULL DEFAULT 'none',
    "wait_for_campaign_completion" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settlement_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settlement_policies_key_key" ON "settlement_policies"("key");

CREATE TABLE "escrow_snapshots" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "budget_minor" INTEGER NOT NULL,
    "reward_per_unit_minor" INTEGER NOT NULL,
    "target_quantity" INTEGER NOT NULL,
    "campaign_revision_at" TEXT NOT NULL,
    "settlement_policy_key" TEXT NOT NULL,
    "policy_snapshot" JSONB NOT NULL,
    "reward_snapshot" JSONB NOT NULL,
    "budget_snapshot" JSONB NOT NULL,
    "metadata" JSONB,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "immutable" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "escrow_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "escrow_snapshots_public_id_key" ON "escrow_snapshots"("public_id");
CREATE INDEX "escrow_snapshots_campaign_id_captured_at_idx" ON "escrow_snapshots"("campaign_id", "captured_at");
ALTER TABLE "escrow_snapshots" ADD CONSTRAINT "escrow_snapshots_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "escrow_accounts" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "assignment_id" TEXT,
    "currency" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "reserved_minor" INTEGER NOT NULL DEFAULT 0,
    "released_minor" INTEGER NOT NULL DEFAULT 0,
    "cancelled_minor" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "escrow_accounts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "escrow_accounts_campaign_id_status_idx" ON "escrow_accounts"("campaign_id", "status");
CREATE INDEX "escrow_accounts_assignment_id_idx" ON "escrow_accounts"("assignment_id");
CREATE INDEX "escrow_accounts_snapshot_id_idx" ON "escrow_accounts"("snapshot_id");
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_snapshot_id_fkey"
  FOREIGN KEY ("snapshot_id") REFERENCES "escrow_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "escrow_accounts" ADD CONSTRAINT "escrow_accounts_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currency" TEXT NOT NULL,
    "owner_user_id" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wallets_public_id_key" ON "wallets"("public_id");
CREATE UNIQUE INDEX "wallets_kind_owner_user_id_currency_key" ON "wallets"("kind", "owner_user_id", "currency");
CREATE INDEX "wallets_owner_user_id_idx" ON "wallets"("owner_user_id");
CREATE INDEX "wallets_organization_id_idx" ON "wallets"("organization_id");
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_owner_user_id_fkey"
  FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "wallet_projections" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "available_minor" INTEGER NOT NULL DEFAULT 0,
    "pending_minor" INTEGER NOT NULL DEFAULT 0,
    "held_minor" INTEGER NOT NULL DEFAULT 0,
    "lifetime_earned_minor" INTEGER NOT NULL DEFAULT 0,
    "lifetime_paid_minor" INTEGER NOT NULL DEFAULT 0,
    "lifetime_adjustments_minor" INTEGER NOT NULL DEFAULT 0,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_projections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wallet_projections_wallet_id_key" ON "wallet_projections"("wallet_id");
ALTER TABLE "wallet_projections" ADD CONSTRAINT "wallet_projections_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "financial_transactions" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL DEFAULT 0,
    "net_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "campaign_id" TEXT,
    "assignment_id" TEXT,
    "submission_id" TEXT,
    "review_decision_id" TEXT,
    "settlement_id" TEXT,
    "organization_id" TEXT,
    "source_wallet_id" TEXT,
    "destination_wallet_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "financial_transactions_public_id_key" ON "financial_transactions"("public_id");
CREATE UNIQUE INDEX "financial_transactions_idempotency_key_key" ON "financial_transactions"("idempotency_key");
CREATE INDEX "financial_transactions_type_status_idx" ON "financial_transactions"("type", "status");
CREATE INDEX "financial_transactions_campaign_id_idx" ON "financial_transactions"("campaign_id");
CREATE INDEX "financial_transactions_settlement_id_idx" ON "financial_transactions"("settlement_id");

CREATE TABLE "ledger_journals" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currency" TEXT NOT NULL,
    "memo" TEXT,
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_at" TIMESTAMP(3),
    CONSTRAINT "ledger_journals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ledger_journals_transaction_id_key" ON "ledger_journals"("transaction_id");
CREATE UNIQUE INDEX "ledger_journals_idempotency_key_key" ON "ledger_journals"("idempotency_key");
CREATE INDEX "ledger_journals_transaction_type_status_idx" ON "ledger_journals"("transaction_type", "status");
ALTER TABLE "ledger_journals" ADD CONSTRAINT "ledger_journals_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "journal_id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "wallet_id" TEXT,
    "side" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ledger_entries_journal_id_idx" ON "ledger_entries"("journal_id");
CREATE INDEX "ledger_entries_wallet_id_account_code_idx" ON "ledger_entries"("wallet_id", "account_code");
CREATE INDEX "ledger_entries_account_code_side_idx" ON "ledger_entries"("account_code", "side");
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journal_id_fkey"
  FOREIGN KEY ("journal_id") REFERENCES "ledger_journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_fkey"
  FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "settlement_batches" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "currency" TEXT NOT NULL,
    "batch_mode" TEXT NOT NULL,
    "total_minor" INTEGER NOT NULL DEFAULT 0,
    "item_count" INTEGER NOT NULL DEFAULT 0,
    "period_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "reconciled_at" TIMESTAMP(3),
    "metadata" JSONB,
    CONSTRAINT "settlement_batches_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settlement_batches_public_id_key" ON "settlement_batches"("public_id");
CREATE UNIQUE INDEX "settlement_batches_batch_mode_period_key_currency_key" ON "settlement_batches"("batch_mode", "period_key", "currency");
CREATE INDEX "settlement_batches_status_idx" ON "settlement_batches"("status");

CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "policy_key" TEXT NOT NULL,
    "policy_id" TEXT,
    "policy_snapshot" JSONB NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "review_decision_id" TEXT NOT NULL,
    "worker_user_id" TEXT NOT NULL,
    "worker_wallet_id" TEXT NOT NULL,
    "escrow_snapshot_id" TEXT NOT NULL,
    "escrow_account_id" TEXT,
    "batch_id" TEXT,
    "amount_minor" INTEGER NOT NULL,
    "fee_minor" INTEGER NOT NULL DEFAULT 0,
    "net_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "reward_snapshot" JSONB NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "ledger_transaction_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "processing_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settlements_public_id_key" ON "settlements"("public_id");
CREATE UNIQUE INDEX "settlements_idempotency_key_key" ON "settlements"("idempotency_key");
CREATE INDEX "settlements_status_scheduled_at_idx" ON "settlements"("status", "scheduled_at");
CREATE INDEX "settlements_worker_user_id_status_idx" ON "settlements"("worker_user_id", "status");
CREATE INDEX "settlements_campaign_id_idx" ON "settlements"("campaign_id");
CREATE INDEX "settlements_review_decision_id_idx" ON "settlements"("review_decision_id");
CREATE INDEX "settlements_batch_id_idx" ON "settlements"("batch_id");

ALTER TABLE "settlements" ADD CONSTRAINT "settlements_policy_id_fkey"
  FOREIGN KEY ("policy_id") REFERENCES "settlement_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_worker_user_id_fkey"
  FOREIGN KEY ("worker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_worker_wallet_id_fkey"
  FOREIGN KEY ("worker_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_escrow_snapshot_id_fkey"
  FOREIGN KEY ("escrow_snapshot_id") REFERENCES "escrow_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_escrow_account_id_fkey"
  FOREIGN KEY ("escrow_account_id") REFERENCES "escrow_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "settlement_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "settlement_policies" ("id", "key", "name", "description", "hold_days", "requires_manual_approval", "batch_mode", "wait_for_campaign_completion", "active", "created_at", "updated_at") VALUES
('spol_immediate', 'immediate', 'Immediate', 'Settle as soon as review approves.', 0, false, 'none', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('spol_hold', 'hold_period', 'Hold Period', 'Hold for a fixed number of days after approval.', 7, false, 'none', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('spol_campaign', 'campaign_completion', 'Campaign Completion', 'Settle only after the campaign closes.', 0, false, 'none', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('spol_daily', 'daily_batch', 'Daily Batch', 'Group into daily settlement batches.', 0, false, 'daily', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('spol_weekly', 'weekly_batch', 'Weekly Batch', 'Group into weekly settlement batches.', 0, false, 'weekly', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('spol_manual', 'manual_finance_approval', 'Manual Finance Approval', 'Requires finance approval before ledger release.', 0, true, 'none', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "settlement_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "escrow_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "escrow_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wallet_projections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "financial_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger_journals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settlement_batches" ENABLE ROW LEVEL SECURITY;
