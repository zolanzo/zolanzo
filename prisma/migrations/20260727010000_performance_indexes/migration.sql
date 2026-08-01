-- Performance audit indexes (safe; no business-logic changes)
-- Assignment expire job: status + expiresAt
CREATE INDEX IF NOT EXISTS "assignments_status_expires_at_idx"
  ON "assignments" ("status", "expires_at");

-- Campaign org dashboards
CREATE INDEX IF NOT EXISTS "campaigns_organization_id_status_idx"
  ON "campaigns" ("organization_id", "status");

-- Financial transaction org filters
CREATE INDEX IF NOT EXISTS "financial_transactions_organization_id_status_idx"
  ON "financial_transactions" ("organization_id", "status");

-- Trust event health windows + profile joins
CREATE INDEX IF NOT EXISTS "trust_events_status_created_at_idx"
  ON "trust_events" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "trust_events_profile_id_idx"
  ON "trust_events" ("profile_id");

-- Analytics event health windows
CREATE INDEX IF NOT EXISTS "analytics_events_status_created_at_idx"
  ON "analytics_events" ("status", "created_at");
