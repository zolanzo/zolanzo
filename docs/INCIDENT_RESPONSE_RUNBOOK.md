# Incident Response Runbook

**Product:** ZOLANZO  
**Phase:** 3A.5  
**Companion:** [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md) · [BUSINESS_CONTINUITY_PLAN.md](./BUSINESS_CONTINUITY_PLAN.md) · Admin playbooks in `features/admin/services/playbooks.ts`

---

## 0. Universal first response (all incidents)

1. **Capture correlation** — note `correlationId` / time window from logs or Command Center.
2. **Check probes** — `GET /health`, `GET /readiness` (status, checks, observability block).
3. **Check Command Center** — `/admin` footer: platform status, latency, error rate, webhooks, alerts.
4. **Classify severity**

| Sev | Meaning | Example |
| --- | --- | --- |
| SEV-1 | P0 down or money at risk | DB down, ledger corruption, auth total outage |
| SEV-2 | Major degradation | Storage down, queue backlog, high 5xx |
| SEV-3 | Limited / vendor | Single provider fail, one queue SLA breach |

5. **Declare mode** (BCP Mode A/B/C/D) and Incident Commander.
6. **Freeze money** on SEV-1 finance risk (no approve/process withdrawals/payments).
7. **Do not** disable RLS, skip migrate history, or hand-edit wallet balances.

---

## 1. Database outage

**Signals:** `/readiness` `database=down`; Prisma errors; Command Center DB status down; alert `database_unavailable`.

**Steps:**

1. Confirm Supabase project status (Dashboard + CLI) — correct project `ffvwviabpyhjeoxjxunb` only.
2. Check pooler vs direct: `DATABASE_URL` (6543) vs `DIRECT_URL` (5432).
3. If platform incident: wait / follow Supabase status; enable Mode C.
4. If credentials/network: rotate/reset DB password; update env; redeploy.
5. If corruption / bad migrate: restore per [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md) §4.
6. After recovery: `npx prisma migrate status`; smoke login + `SELECT 1`.
7. Drain job backlog cautiously; inspect failed finance jobs first.

**Owner:** Database operator + Incident Commander.

---

## 2. Storage outage

**Signals:** `/readiness` `storage=degraded|down`; evidence upload failures; `listBuckets` errors.

**Steps:**

1. Confirm service role key present and not revoked.
2. Confirm Storage API in Supabase Dashboard.
3. If buckets missing: recreate from `constants/storage.ts` (empty).
4. If objects lost: restore per DR plan §4.3; quarantine submissions with broken refs.
5. Pause evidence attach if uploads cannot persist (Mode B for submissions).

**Owner:** App operator.

---

## 3. Auth outage (Supabase Auth)

**Signals:** `/readiness` `supabase_auth` bad; login/signup failures; session refresh errors in middleware.

**Steps:**

1. Hit `{NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`.
2. Verify anon key / URL match the Zolanzo project (not BamSignal).
3. Check Auth rate limits / provider outages (Google OAuth if enabled).
4. If Auth service down: Mode C for login; status page.
5. If misconfiguration: fix env; redeploy; do not recreate users manually unless restore.

**Owner:** App operator.

---

## 4. Payment provider outage

**Signals:** Payment queue backlog; webhook rejects spike; `payment.failed` metrics; adapter errors.

**Builtin playbook:** `payment_failure` (verify webhook → provider snapshot → replay → escalate).

**Steps:**

1. Confirm webhook auth: signature / timestamp / replay (`WEBHOOK_SIGNING_SECRET`).
2. Inspect Command Center webhook counters (rejected / replay blocked).
3. Freeze new funding if provider is unsafe; keep `PAY-` intents immutable.
4. Do **not** credit ledger from unsigned / stub payloads.
5. When provider recovers: controlled verify/replay with correlation IDs.
6. Phase 3B+: switch adapter via capability select if secondary provider configured.

**Owner:** Finance + engineering.

---

## 5. Email / SMS provider outage

**Signals:** Notification queue failed/aged; adapter delivery failures; alert on notification jobs.

**Builtin playbook:** `notification_failure` (retry → inspect adapter → switch provider → escalate).

**Steps:**

1. List failed `notification_jobs` via ops queue.
2. Retry with `dispatchNotificationJob` / ops retry command when safe.
3. Prefer memory/stub only in non-prod; in prod wait for provider or switch adapter.
4. Intents remain durable — do not delete `NTF-` rows to “clear” the queue.
5. Escalate to Sendchamp/Resend status pages (when live).

**Owner:** Operations.

---

## 6. Queue backlog

**Signals:** Alert `queue_backlog`; readiness queue depth; Command Center queue SLA breach; `job.queue.depth` gauge.

**Steps:**

1. Confirm cron/worker running: `npm run jobs:cron` or `ZOLANZO_CRON_ENABLED=1`.
2. Check `scheduler` / `background_workers` on `/readiness`.
3. Inspect failed jobs in logs (`job.execute` spans, `JOB_FAILED`).
4. Clear poison messages by fixing data / code — do not infinite-retry finance blindly.
5. Scale workers if host allows; temporarily reduce non-critical schedules if needed.

**Owner:** Operations + engineering.

---

## 7. Scheduler failure

**Signals:** `/readiness` scheduler not `running`; `background_workers=degraded`; stale `lastTickAt`.

**Steps:**

1. Restart dedicated cron process (`npm run jobs:cron`).
2. Confirm only **one** active leader if multiple instances (locks: `lib/reliability/scheduler-lock.ts`).
3. Check process crash logs / OOM on host.
4. Validate schedules in `jobs/schedules.ts` still registered.
5. Manually run critical job once via ops tooling if needed (with correlation).

**Owner:** Engineering.

---

## 8. High error-rate incidents

**Signals:** Alert `http_5xx_spike` / `high_latency`; Command Center error rate; Sentry spike.

**Steps:**

1. Filter logs by `correlationId` and `operation`.
2. Identify deploy marker (`GIT_COMMIT` / host deployment id).
3. Rollback app deploy if error started at release (prefer host previous deployment).
4. If DB-related, follow §1.
5. Capture exceptions already flow to monitoring adapter — confirm `SENTRY_DSN` if expected.

**Owner:** Engineering + Incident Commander.

---

## 9. Withdrawal / finance stuck

**Builtin playbook:** `withdrawal_failure` (ledger reservation → batch → retry/cancel → escalate).

**Steps:**

1. Freeze further approvals (`withdrawals.approve`).
2. Inspect `WDR-` status + reservation; never mutate balances.
3. Use ops commands only through audited `OPC-` paths.
4. Complete or cancel via domain services after root cause fixed.
5. Reconcile ledger journals vs projections (`projectWallet`) after fix.

**Owner:** Finance.

---

## 10. Security incident (brief)

1. Rotate compromised secrets (DB, service role, webhook, CSRF, provider keys).
2. Revoke sessions if user compromise (`sessions` revoke).
3. Do not disable RLS to “fix” access.
4. Preserve audit logs / OPC history.
5. Follow [SECURITY_MODEL.md](./SECURITY_MODEL.md) and 3A.3 report.

---

## 11. Post-incident

- [ ] Timeline with correlation IDs
- [ ] Root cause + contributing factors
- [ ] Customer impact (money, data, downtime)
- [ ] Action items (code, docs, drills)
- [ ] Update this runbook if steps were wrong
