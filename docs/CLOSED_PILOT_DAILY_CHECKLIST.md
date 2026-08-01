# Closed Pilot — Daily Operations Checklist

**Fill one copy per day.** Attach screenshots or Command Center notes as needed.  
Severity reference: Critical · High · Medium · Low (`docs/RC1_GOVERNANCE.md`).

---

## Date: _______________   Operator: _______________   Env: staging / production-pilot

### Platform

| Check | Result (ok / degraded / fail) | Notes |
| --- | --- | --- |
| `GET /health` | | |
| `GET /readiness` | | |
| Deploy revision / release tag | | |
| Cron / jobs runner alive | | |

### Providers

| Check | Result | Notes |
| --- | --- | --- |
| Paystack sandbox | | |
| Resend | | |
| Sendchamp | | |
| Supabase Storage | | |

### Command Center

| Panel | Status | Attention items |
| --- | --- | --- |
| Payment Health | | |
| Email Health | | |
| Communication Health | | |
| Storage Health | | |
| Queues / DLQ | | |

### Daily counters

| Metric | Value | Target |
| --- | --- | --- |
| New registrations | | — |
| Registration failures | | ≈0 |
| Emails delivered | | ≥98% success |
| SMS delivered | | ≥95% success |
| Payments succeeded | | — |
| Payment mismatches | | **0** |
| Webhook failures | | ≈0 |
| Storage upload failures | | ≈0 |
| 5xx rate | | near 0 |
| p95 API latency | | note baseline |
| Support tickets opened | | — |
| Critical defects open | | **0** |
| High defects open | | **0** |

### New defects today

| ID | Severity | Journey | Summary | Owner |
| --- | --- | --- | --- | --- |
| | | | | |

### Fixes shipped today (Critical/High only)

| Commit / PR | Severity | Verified journey |
| --- | --- | --- |
| | | |

### Decision for tomorrow

- [ ] Continue invites  
- [ ] Pause invites  
- [ ] Hotfix required  
- [ ] Escalate (security / money)

**Sign-off:** __________________
