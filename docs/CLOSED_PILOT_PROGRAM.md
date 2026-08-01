# Closed Pilot Program — Operating Manual

**Phase:** 3B.6  
**Status:** Program prepared (RC1)  
**Freeze:** Feature + schema  
**Duration:** 2–4 weeks  
**Target cohort:** 25–100 invited users  

Companion docs:

- [RC1_GOVERNANCE.md](./RC1_GOVERNANCE.md)  
- [CLOSED_PILOT_DAILY_CHECKLIST.md](./CLOSED_PILOT_DAILY_CHECKLIST.md)  
- [CLOSED_PILOT_REPORT.md](./CLOSED_PILOT_REPORT.md)  
- [STORAGE_BUCKET_POLICIES.md](./STORAGE_BUCKET_POLICIES.md)  
- [PHASE_3B4_E2E_CERTIFICATION.md](./PHASE_3B4_E2E_CERTIFICATION.md)

---

## Mission

Validate Zolanzo with **real users under controlled conditions**.

- No new product features  
- No schema changes  
- Bug fixes / reliability / security only  

---

## Pilot objectives

1. Prove registration → org → campaign → assignment → submission → review works for invited Nigerians.  
2. Prove wallet funding (Paystack sandbox) reconciles 100% to ledger.  
3. Prove email (Resend) and SMS (Sendchamp) deliver at target rates.  
4. Prove storage uploads succeed and Command Center health stays green.  
5. Collect support tickets and classify defects without expanding scope.

---

## Environment gate (must be green before invites)

| Check | How |
| --- | --- |
| Production / staging deploy healthy | Platform host status |
| `GET /health` → ok | Smoke after deploy |
| `GET /readiness` → critical deps ok | DB / auth / storage |
| Paystack **sandbox** configured | `PAYSTACK_SECRET_KEY` (test) |
| Resend configured | `RESEND_API_KEY` + from domain |
| Sendchamp configured | `SENDCHAMP_API_KEY` + sender |
| Supabase Storage configured | `STORAGE_PROVIDER=supabase` + service role |
| Six buckets created | See STORAGE_BUCKET_POLICIES |
| Monitoring enabled | Sentry / Command Center / alerts |
| Cron / jobs runner attached | `notifications.retry`, `storage.cleanup-temp`, payment reconcile |
| Webhooks registered | Paystack · Resend · Sendchamp |

**Do not invite users until this gate is checked off in the pilot report.**

---

## User groups to recruit

| Group | Purpose |
| --- | --- |
| Organizations (clients) | Create/fund/publish campaigns |
| Workers | Claim, execute, submit |
| Reviewers | Review queue decisions |
| Admins / ops | Command Center, health, commands |
| Marketplace vendors* | Task work suppliers (campaign side) |
| Marketplace buyers* | Work consumers (client side) |

\*Product listing marketplace remains out of scope; use **task marketplace** roles.

Suggested mix for ~50 users: ~8 orgs · ~25 workers · ~5 reviewers · ~3 admins · remainder support/observers.

---

## Business scenarios (real users)

Run each at least once with non-engineer pilot users:

1. Registration + email verify + profile + welcome notifications  
2. Organization create / invite / accept / role / leave  
3. Campaign create → fund → publish → generate instances  
4. Worker claim → assignment → submission + evidence upload  
5. Validation → review → approval → settlement  
6. Wallet funding (sandbox) → webhook → ledger → receipt email/SMS  
7. Withdrawal request path (ledger-complete; bank rails still deferred)  
8. Admin: health, payment/email/communication/storage panels, audit  

Script templates: reuse journey IDs J1–J8 from Phase 3B.4 certification.

---

## Success metrics (exit targets)

| Metric | Target |
| --- | --- |
| Registration success | ≥ 99% |
| Payment reconciliation | 100% |
| Email delivery | ≥ 98% |
| SMS delivery | ≥ 95% (provider/network dependent) |
| API availability | ≥ 99.9% during pilot window |
| Critical defects | 0 open |
| High defects | 0 open |
| Failed queue jobs | Near zero after retries |
| Storage upload success | ≥ 99% |

---

## Daily monitoring

Use [CLOSED_PILOT_DAILY_CHECKLIST.md](./CLOSED_PILOT_DAILY_CHECKLIST.md).

Surfaces:

- `/health` · `/readiness`  
- Command Center: Payment · Email · Communication · Storage Health  
- Provider dashboards: Paystack · Resend · Sendchamp · Supabase  
- Support inbox / ticket board  

---

## Bug management

1. Log defect with severity (Critical / High / Medium / Low).  
2. Link to journey / public IDs (`ORG-…`, `CMP-…`, `PAY-…`).  
3. Fix **Critical** and **High** only on `release/1.0`.  
4. Re-run affected journey path + full `npm test` before deploy.  
5. Medium/Low → backlog for post-pilot.

---

## Exit criteria

Pilot may end with a launch recommendation when:

- [ ] No Critical defects open  
- [ ] No High defects open  
- [ ] Payment success / reconciliation acceptable (100% reconcile target)  
- [ ] Notification delivery acceptable (email ≥98%, SMS ≥95%)  
- [ ] Storage stable (≥99% upload success)  
- [ ] Queues stable (DLQ near zero after retries)  
- [ ] Health/readiness stable for ≥7 consecutive days  

Then update [CLOSED_PILOT_REPORT.md](./CLOSED_PILOT_REPORT.md) with final **GO / GO WITH CONDITIONS / NO GO**.

---

## After pilot (3B.7 preview)

If GO:

1. Switch providers to live credentials where appropriate.  
2. Verify DNS, domains, webhooks.  
3. Confirm backup / PITR.  
4. Tag `v1.0.0`.  
5. Open registrations carefully.
