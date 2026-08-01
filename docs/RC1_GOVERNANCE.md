# RC1 Governance — Release Candidate 1.0

**Effective:** 2026-07-26  
**Scope:** Closed pilot through public launch decision  
**Codebase state:** Release Candidate (RC1) — 287 tests · feature/schema freeze

---

## Branch model

```text
main            ← stable integration line (mirror of release when green)
release/1.0     ← pilot / launch branch (RC1 freeze)
develop         ← optional post-pilot feature work (do not merge into release/1.0)
```

### Cut procedure (operator)

1. Commit and push all RC1 work on `main` when ready.  
2. `git checkout -b release/1.0` from the RC1 commit.  
3. Protect `release/1.0` (required reviews; no force-push).  
4. Tag `v1.0.0-rc.1` on the cut.  
5. After successful pilot exit → `v1.0.0` and open registrations (3B.7).

---

## Allowed on `release/1.0`

| Allowed | Examples |
| --- | --- |
| Security fixes | Auth/RBAC/webhook/signature defects |
| Bug fixes | Broken journeys, incorrect statuses, null crashes |
| Reliability | Retry/DLQ, circuit breaker tuning, probe fixes |
| Performance | Query indexes (non-schema-breaking), timeout tuning |
| Documentation | Runbooks, pilot reports, ops checklists |

Every change must:

1. Have a clear defect / risk justification.  
2. Pass `npm run typecheck` and `npm test`.  
3. Be re-checked against relevant journeys in `journeys/` when the change touches a certified path.

---

## Not allowed on `release/1.0`

| Forbidden | Why |
| --- | --- |
| New tables / Prisma schema redesign | Schema freeze |
| New product features | Feature freeze |
| UI redesigns | Scope creep / regression risk |
| Breaking API / server-action contract changes | Pilot clients depend on contracts |
| Architecture rewrites / new providers | Defer to post-launch |
| New domains (product marketplace, bank rails, etc.) | Out of pilot critical path |

---

## Defect severity (pilot)

| Severity | Definition | Action on `release/1.0` |
| --- | --- | --- |
| **Critical** | Data loss, money incorrect, auth bypass, P0 outage | Fix immediately; block pilot expansion |
| **High** | Major journey broken for many users | Fix before exit criteria |
| **Medium** | Workaround exists; limited blast radius | Backlog; post-pilot unless easy |
| **Low** | Cosmetic / edge | Defer |

**Fix during pilot:** Critical + High only.

---

## Environments

| Env | Role in pilot |
| --- | --- |
| Staging | Dress rehearsal; sandbox Paystack |
| Production (pilot mode) | Invited users only; feature flags / invite gate |

Do not use production for open registration until 3B.7 exit criteria pass.
