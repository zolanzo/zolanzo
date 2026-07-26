-- Payment Platform

CREATE TABLE "provider_configurations" (
    "id" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_configurations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_configurations_provider_key_key" ON "provider_configurations"("provider_key");

CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "client_user_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reference" TEXT NOT NULL,
    "campaign_id" TEXT,
    "provider_key" TEXT,
    "provider_ref" TEXT,
    "checkout_url" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_intents_public_id_key" ON "payment_intents"("public_id");
CREATE UNIQUE INDEX "payment_intents_reference_key" ON "payment_intents"("reference");
CREATE UNIQUE INDEX "payment_intents_idempotency_key_key" ON "payment_intents"("idempotency_key");
CREATE INDEX "payment_intents_organization_id_status_idx" ON "payment_intents"("organization_id", "status");
CREATE INDEX "payment_intents_client_user_id_idx" ON "payment_intents"("client_user_id");
CREATE INDEX "payment_intents_campaign_id_idx" ON "payment_intents"("campaign_id");
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_client_user_id_fkey"
  FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_campaign_id_fkey"
  FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "payment_intent_id" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "provider_transaction_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "verification_snapshot" JSONB,
    "ledger_transaction_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_records_provider_key_provider_transaction_id_key" ON "payment_records"("provider_key", "provider_transaction_id");
CREATE INDEX "payment_records_payment_intent_id_idx" ON "payment_records"("payment_intent_id");
CREATE INDEX "payment_records_status_idx" ON "payment_records"("status");
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_payment_intent_id_fkey"
  FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "payment_intent_id" TEXT,
    "type" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "provider_ref" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_events_idempotency_key_key" ON "payment_events"("idempotency_key");
CREATE INDEX "payment_events_type_processed_idx" ON "payment_events"("type", "processed");
CREATE INDEX "payment_events_provider_key_provider_ref_idx" ON "payment_events"("provider_key", "provider_ref");
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_intent_id_fkey"
  FOREIGN KEY ("payment_intent_id") REFERENCES "payment_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "provider_configurations" ("id", "provider_key", "display_name", "capabilities", "active", "config", "created_at", "updated_at") VALUES
('pcfg_memory', 'memory', 'Memory (local/test)', '["accepts_payments","refunds","webhooks","multi_currency"]', true, '{"stub":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pcfg_paystack', 'paystack', 'Paystack', '["accepts_payments","bank_transfers","refunds","webhooks","multi_currency","payouts","virtual_accounts"]', true, '{"stub":true,"region":"ng"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pcfg_flutterwave', 'flutterwave', 'Flutterwave', '["accepts_payments","bank_transfers","refunds","webhooks","multi_currency","payouts"]', true, '{"stub":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pcfg_stripe', 'stripe', 'Stripe', '["accepts_payments","refunds","split_payments","recurring_billing","webhooks","multi_currency","payouts"]', true, '{"stub":true}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pcfg_monnify', 'monnify', 'Monnify', '["accepts_payments","bank_transfers","virtual_accounts","webhooks","payouts"]', true, '{"stub":true,"region":"ng"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "provider_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_intents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_events" ENABLE ROW LEVEL SECURITY;
