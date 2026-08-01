# Business Continuity Plan

**Product:** ZOLANZO  
**Phase:** 3A.5  
**Companion:** [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md) · [INCIDENT_RESPONSE_RUNBOOK.md](./INCIDENT_RESPONSE_RUNBOOK.md)

---

## 1. Purpose

Keep critical ZOLANZO capabilities available (or safely degraded) during incidents affecting infrastructure, vendors, or people — without changing domain invariants (ledger, intents, adapters).

---

## 2. Critical business functions

| Priority | Function | Depends on | Degraded mode |
| --- | --- | --- | --- |
| P0 | Authentication / sessions | Supabase Auth + Postgres | Read-only status page; no new sessions |
| P0 | Ledger integrity | Postgres | **Halt** money mutations; no “best effort” balance edits |
| P0 | Withdrawal / payment processing | Postgres + workers + (later) providers | Freeze approvals; queue for later |
| P1 | Marketplace claim / assignments | Postgres + app | Pause claims via ops; browse may fail |
| P1 | Submissions / evidence | Postgres + Storage | Block uploads if storage down |
| P1 | Notifications | Adapters (email/SMS/push) | Intent recorded; delivery delayed |
| P2 | Admin Command Center | App + Postgres + metrics | Use `/readiness` + logs if UI down |
| P2 | AI recommendations | AI plugins | Disable via policy; human review continues |

**Invariant:** Never bypass the ledger or mutate wallet balances to “unstick” an incident.

---

## 3. Continuity modes

### Mode A — Normal

All dependencies `ok` / acceptable `degraded` on `/readiness`.

### Mode B — Read-only / freeze money

Triggers: DB corruption risk, failed migration, payment provider mass failure, security incident.

Actions:

1. Disable payouts / approvals (`withdrawals.approve` operators stand down; feature flags if present).
2. Pause marketplace claims if inventory integrity uncertain.
3. Keep auth + read APIs if DB is healthy.
4. Communicate ETA from Incident Commander.

### Mode C — Full outage

Triggers: Supabase project unavailable, DNS failure, host down.

Actions:

1. Status communication only.
2. Execute [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md).
3. Do not accept user work that cannot be durably stored.

### Mode D — Vendor outage (single provider)

Triggers: Paystack / Sendchamp / Resend / FCM down (Phase 3B+).

Actions:

1. Keep domain intents/jobs; adapters fail soft.
2. Switch to alternate adapter when configured (capability select).
3. Use Command Center queues + playbooks (`features/admin/services/playbooks.ts`).

---

## 4. People & access continuity

| Need | Continuity control |
| --- | --- |
| Ops access | At least two people with Supabase org + host access |
| Break-glass | Documented emergency admin path (super_admin); audited |
| Secrets | Vault access independent of app uptime |
| On-call | Escalate via existing ops roles (`operations`, `finance`, `admin`) |

---

## 5. Data continuity

| Data class | Continuity approach |
| --- | --- |
| Financial journals | Postgres backup / PITR; never rebuild from wallet projections |
| Assignments / submissions | Postgres + storage restore |
| Auth identities | Supabase Auth backup with project |
| Audit / OPC commands | Postgres; preserve for forensics |

---

## 6. Communication plan

| Audience | Channel | Cadence |
| --- | --- | --- |
| Engineering / ops | Internal chat + incident ticket | Continuous |
| Leadership | Summary at Mode B/C | Hourly or on change |
| Users (if customer-facing) | Status page / banner | On Mode B/C |

Message template:

> Zolanzo is experiencing a [database|auth|storage|provider] issue.  
> Money movement is [operating normally | frozen].  
> Next update by [time]. Correlation / incident id: [id].

---

## 7. Return to normal

1. Dependencies green on `/readiness`.
2. No open critical alerts on Command Center.
3. Spot-check: login, wallet projection, one queue drain.
4. Finance confirms no stuck `WDR-` / `PAY-` requiring manual journal.
5. Incident Commander declares Mode A.
6. Post-incident review within 5 business days.

---

## 8. Dependencies on Phase 3B+

Until live providers are wired:

- Payment / SMS / email “continuity” means **stub/memory adapters** and queued intents — not alternate live rails.
- Document vendor runbooks now; execute failover after 3B credentials exist.
