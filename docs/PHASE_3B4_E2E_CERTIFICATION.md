# Phase 3B.4 — End-to-End Business Journey Certification

**Date:** 2026-07-26  
**Mode:** `path_contract` (legitimate action/service surfaces + failure contracts; no SQL, no admin shortcuts, no DB edits)  
**Database reachable from cert host:** No  
**Provider keys present:** Paystack ✗ · Resend ✗ · Sendchamp ✗  

---

## Executive verdict

| Metric | Result |
| --- | --- |
| Business Workflow Readiness | **70 / 100** |
| Critical path FAIL | None |
| Critical path PASS | J1 · J2 · J4 · J7 (+ path steps on J5/J6/J8) |
| BLOCKED (scope / staging / keys) | J3 · J5 (live keys) · J6 (payout rails) · J8 (storage) |
| Recommendation | **Conditional Pilot** |

**Rationale:** Critical domain workflows are path-certified and notification wiring is complete. Live dual-session browser runs, live provider keys, product-listing marketplace, cloud storage, and external payout rails remain BLOCKED. Treat the codebase as a **release candidate**: freeze schema/features; only bug fixes until staging sessions clear the remaining gates.

---

## Certification rules honored

| Rule | Honored |
| --- | :---: |
| Empty user session as start of live journeys | Staging gate (recorded as step; does not fail path rollup) |
| No database editing / manual SQL | ✅ |
| No admin shortcuts around domain invariants | ✅ |
| Public surfaces only (server actions + webhook routes) | ✅ |
| PASS / FAIL / BLOCKED per journey | ✅ |

Harness: `journeys/certify.ts` · tests: `journeys/journeys.test.ts`  
Suite after this phase: **275** tests · typecheck clean.

---

## Notification wiring completed in this phase

Domain events now emit hub intents (fire-and-forget via `safeEmitDomainNotification`):

| Event | Source |
| --- | --- |
| `auth.welcome` | Provisioning |
| `org.invite_member` | Organization invite |
| `payment.receipt` | Verified Paystack funding |
| `campaign.funded` | Campaign funding success |
| `assignment.received` | Marketplace claim confirm |
| `settlement.completed` | Settlement ledger release |
| `withdrawal.requested` / `approved` / `completed` | Withdrawal lifecycle |

---

## Journey results

### Journey 1 — User Registration · **PASS**

| | |
| --- | --- |
| Duration | &lt;10 ms (path contract) |
| Systems | auth · provisioning · profile · notifications · audit |
| Notifications | `auth.welcome` (email + SMS + in_app) |
| Audit | `user.registered` · `email.verified` |

| Step | Status |
| --- | :---: |
| Register / provision | PASS |
| Email verification callback | PASS |
| Phone verification (if enabled) | PASS (N/A — not enabled) |
| Profile | PASS |
| Onboarding (personal org) | PASS |
| Welcome email + SMS intents | PASS |
| Dashboard `/app` | PASS |
| Live empty-session browser run | BLOCKED (staging) |

**Launch impact:** low  
**Remaining:** Staging browser registration against live Supabase.

---

### Journey 2 — Organization · **PASS**

| | |
| --- | --- |
| Systems | organizations · RBAC · notifications · audit |
| Notifications | `org.invite_member` |
| Audit | invite / join / leave / role-change |

| Step | Status |
| --- | :---: |
| Create / invite / accept / role / leave surfaces | PASS |
| Invite notification | PASS |
| Expired invitation (`INVITE_EXPIRED`) | PASS |
| Audit history | PASS |
| Live multi-user accept session | BLOCKED (staging) |

**Launch impact:** low

---

### Journey 3 — Marketplace (product listings) · **BLOCKED**

| | |
| --- | --- |
| Systems | task-marketplace (supporting) |
| Specified product | Vendor listing → upload → publish → moderation → buyer contact |

| Step | Status |
| --- | :---: |
| Product listing / moderation / buyer messaging | **BLOCKED** — not in current product scope |
| Task work marketplace (browse → reserve → claim) | PASS — supports Journey 4 |

**Launch impact:** medium  
**Note:** Zolanzo’s marketplace is the **task work opportunity** market (`docs/MARKETPLACE.md`), not a vendor storefront. Do not block campaign pilot on product listings.

---

### Journey 4 — Campaign · **PASS**

| | |
| --- | --- |
| Systems | campaigns · tasks · marketplace · assignments · submissions · validation · review |
| Notifications | `assignment.received` |

| Step | Status |
| --- | :---: |
| Full work-engine action surface | PASS |
| Assignment notification | PASS |
| Engine lifecycle contracts | PASS |
| Live client + worker dual session | BLOCKED (staging) |

**Launch impact:** low  
**Canonical path:** `docs/WORKFLOW.md`

---

### Journey 5 — Payment · **BLOCKED** (live keys)

| | |
| --- | --- |
| Systems | payments · ledger · wallet · notifications · Paystack |
| Notifications | `payment.receipt` · `campaign.funded` |

| Step | Status |
| --- | :---: |
| Intent + webhook + funding ledger path | PASS |
| Receipt email + SMS emit | PASS |
| Duplicate webhook idempotency | PASS |
| Live Paystack charge + webhook | **BLOCKED** — `PAYSTACK_SECRET_KEY` absent |

**Launch impact:** medium  
**Remaining:** Operator keys + staging webhook round-trip.

---

### Journey 6 — Settlement · **BLOCKED** (payout rails)

| | |
| --- | --- |
| Systems | settlements · escrow · ledger · wallet · withdrawals · notifications |
| Notifications | `settlement.completed` · `withdrawal.requested/approved/completed` |

| Step | Status |
| --- | :---: |
| Settlement + withdrawal service surfaces | PASS |
| Settlement notification | PASS |
| Withdrawal lifecycle notifications | PASS |
| Live bank-rail payout | **BLOCKED** — external rails deferred by design |

**Launch impact:** medium  
**Remaining:** Payout provider behind adapter (post-pilot acceptable if withdrawals stay internal/ledger-complete for closed pilot).

---

### Journey 7 — Admin · **PASS**

| | |
| --- | --- |
| Systems | admin · observability · payment/email/communication health |

| Step | Status |
| --- | :---: |
| Command Center `/admin` | PASS |
| Payment Health | PASS |
| Email Health | PASS |
| Communication Health | PASS |
| Ops commands + audit explorer | PASS |

**Launch impact:** none

---

### Journey 8 — Failure Tests · **BLOCKED** (storage only)

| Failure case | Status |
| --- | :---: |
| Duplicate webhook | PASS |
| Replay attack | PASS |
| Expired invitation | PASS |
| Permission violation | PASS |
| Invalid payment signature | PASS |
| Duplicate / immutable submission | PASS |
| Storage failure | **BLOCKED** — memory adapter; Phase 3B.5 |
| Notification retry → DLQ | PASS |
| Queue retry schedule | PASS |

**Launch impact:** medium  
**Remaining:** Cloud storage failure simulation in 3B.5.

---

## Remaining defects (launch-relevant)

1. **Staging live sessions** not executed from this host (DB unreachable) — required before expanding beyond closed pilot.  
2. **Provider keys** unset — Paystack / Resend / Sendchamp still stub.  
3. **Product listing marketplace** absent — out of scope for campaign pilot.  
4. **External payout rails** absent — ledger completion only.  
5. **Cloud storage** still memory — evidence URLs are adapter-local (3B.5).  
6. Phone verification product **not enabled** (acceptable; step N/A).

---

## Final score — Business Workflow Readiness

| Band | Score |
| --- | --- |
| Path-certified critical workflows | Strong |
| Live provider / staging gates | Open |
| **Business Workflow Readiness** | **70 / 100** |

### Recommendation

**Conditional Pilot Launch** (closed cohort), not unrestricted public launch.

Conditions before expanding the pilot:

1. Run staging dual-session journeys (J1, J2, J4, J5) with real cookies — no SQL.  
2. Install provider keys and confirm webhook round-trips.  
3. Freeze schema and major features (release candidate discipline).  
4. Defer product-listing marketplace and bank rails unless pilot requires them.  
5. Complete 3B.5 storage before evidence-heavy campaigns at scale.

---

## Release candidate freeze (recommended)

From this point until pilot expansion:

- **No schema changes** unless a critical defect requires them.  
- **No major feature additions.**  
- **Bug fixes and stability only**, each re-validated against these journeys.  
- Treat current tree as the **release candidate**.

---

## STOP

Phase 3B.4 path certification complete.  
Next: **3B.5 Storage, media lifecycle & file pipeline** (or staging live-session clearance under freeze).
