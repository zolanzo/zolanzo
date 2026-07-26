# ZOLANZO — Infrastructure Synchronization Report

**Date:** 2026-07-26  
**Mode:** Read-only audit (no remote writes, no credential fabrication, no automatic fixes)  
**Canonical service-owner recommendation:** `bamsignalhq@gmail.com` for GitHub / Supabase / deployment / CI; personal accounts for day-to-day coding only.

---

## Executive verdict

**Local → GitHub → CI → Supabase → Production is not synchronized.**

The codebase is complete enough to start syncing, but the control plane is missing or pointed at the wrong product:

| Link | Status |
| --- | --- |
| Local git → GitHub | **Broken** — no remotes, no commits |
| GitHub CLI auth | **Broken** — tokens invalid |
| Local env → Supabase (Zolanzo) | **Missing** — no Zolanzo project found |
| MCP Supabase session | **Linked to wrong product** — `BamSignal-Engine` only |
| Prisma migrations → remote | **Not applicable yet** — no Zolanzo database target |
| Deployment (Coolify/Docker/CI) | **Not present in repo** |

**Stopped before any remote mutation.** Manual decisions and access are required below.

---

## 1. Git Status

| Item | Value |
| --- | --- |
| Working tree | `/Users/stanlex/Documents/zolanzo` |
| Git dir | Local `.git` (initialized) |
| Current branch | `main` |
| Commits | **None** (`No commits yet on main`) |
| `origin` | **Not configured** |
| `upstream` | **Not configured** |
| Tracking branch | **None** |
| Default remote HEAD | **N/A** |

**Uncommitted / untracked:** Entire project tree is untracked (app, prisma, docs, package.json, etc.). Nothing is staged.

**Ignored (relevant):** `.env`, `.env.local`, `.env.*.local` via `.gitignore`. `.env.example` is tracked-intended (`!.env.example`). `.cursor/` is **not** ignored (will be committed unless added to `.gitignore`).

**Large files (>5MB outside node_modules/.next):** None found.

---

## 2. GitHub Status

| Item | Value |
| --- | --- |
| Linked repository | **None** (`gh repo view` → no git remotes) |
| Current branch on GitHub | **N/A** |
| `gh` accounts seen | `marykberry555` (active, **token invalid**), `bamsignalhq` (inactive, **token invalid**) |
| Actions / `.github/` | **Absent** |

Cannot report GitHub default branch, protections, or Actions permissions until:

1. `gh auth refresh` (prefer **bamsignalhq** as canonical owner), and  
2. A remote repository exists and is linked as `origin`.

---

## 3. Supabase Status

### MCP / org visibility

| Item | Value |
| --- | --- |
| Organization visible | **Bam Signal** (`bilopfehjwyxbngzpauj`) |
| Projects visible | **1** — `BamSignal-Engine` (`nswiwxmavuqpuzlsascs`, `eu-west-1`, `ACTIVE_HEALTHY`) |
| Project URL | `https://nswiwxmavuqpuzlsascs.supabase.co` |
| Local `supabase/` CLI project | **Absent** (no `supabase/config.toml`, not linked) |
| Supabase CLI | Installed (`2.109.1`); telemetry write failed under sandbox earlier; usable with full FS permissions |

### Critical finding — wrong database product

`BamSignal-Engine` is **not** a Zolanzo schema. Remote evidence:

- Tables include `fixtures`, `tips`, `daily_games`, `stankings_*`, `concierge_*`, `member_*`, etc.
- Supabase migration history versions are `20260413…` / `20260627…` BamSignal/Stankings names — **zero overlap** with Zolanzo Prisma migrations (`20260725…` / `20260726…`).
- Storage buckets: `cover-photos`, `profile-photos` only.

Zolanzo expects domain tables such as `User`, `Organization`, `Campaign`, `LedgerEntry`, and buckets such as `public-brand`, `avatars`, `campaign-assets`, `submission-evidence`, `exports`, `temp-uploads`.

**Do not apply Zolanzo Prisma migrations to `BamSignal-Engine`.** That would corrupt an unrelated production-like system.

### Prisma compatibility

- Local `prisma/schema.prisma` validates.
- `prisma.config.ts` prefers `DIRECT_URL`, then `DATABASE_URL`, else fallback `postgresql://localhost:5432/zolanzo`.
- Local `.env` `DATABASE_URL` points at **`localhost:5432` / `mydb`** (credentials present; host is local).
- `prisma migrate status` → **P1010** user denied access on local DB — local Postgres target is not usable / not provisioned for this user.

---

## 4. Migration Status

### Local Prisma migrations (ordered, no duplicate timestamps)

1. `20260725200000_foundation`  
2. `20260725200001_rls_framework`  
3. `20260725210000_auth_org_platform`  
4. `20260725220000_public_ids`  
5. `20260725230000_task_templates`  
6. `20260725240000_campaigns`  
7. `20260725250000_task_instances`  
8. `20260725260000_marketplace_claims`  
9. `20260725270000_assignment_workspace`  
10. `20260725280000_submission_packages`  
11. `20260725290000_validation_engine`  
12. `20260725295000_review_engine`  
13. `20260726010000_settlement_ledger_engine`  
14. `20260726020000_withdrawal_engine`  
15. `20260726030000_payment_platform`  
16. `20260726040000_notification_hub`  
17. `20260726050000_operations_console`  
18. `20260726060000_ai_plugin_platform`  

Lock: `provider = "postgresql"`.

### Applied / pending / failed

| Check | Result |
| --- | --- |
| Applied on Zolanzo remote | **Unknown / none** — no Zolanzo project |
| Pending on Zolanzo remote | **All 18** once a target exists |
| Failed migrations | **None detected** in local folder |
| Supabase CLI migration history (Zolanzo) | **N/A** — no linked project |
| Drift vs `BamSignal-Engine` | **Total product mismatch** (not schema drift within one app) |

### Why “drift” looks severe

This is **not** classic Prisma↔DB drift on the same app. It is **two different products**:

- Local repo = Zolanzo marketplace / ledger schema (Prisma).  
- Only reachable Supabase project = BamSignal-Engine (legacy/public schema + Stankings).

Until a dedicated Zolanzo Supabase project exists and migrations are applied there, sync cannot be measured as “pending migrations” in the usual sense.

**No automatic fix performed.**

---

## 5. Environment Status

### Files

| File | Status |
| --- | --- |
| `.env` | Present (gitignored) — **only `DATABASE_URL` set** |
| `.env.local` | **Missing** |
| `.env.production` | **Missing** |
| `.env.example` | Present (template) |

### Missing variables (names only — secrets not exposed)

**Required for a real local/staging sync (currently missing from `.env`):**

- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CSRF_SECRET`
- `WEBHOOK_SIGNING_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `ZOLANZO_ENV`
- `NODE_ENV` (not set in `.env`; Node may default at runtime)

**Provider / Phase 3B vars (expected absent for now):**

- Paystack (`PAYSTACK_*` — also absent from `.env.example`)
- `RESEND_API_KEY` (commented in example only)
- Sendchamp (`SENDCHAMP_*`)
- Firebase (`FIREBASE_*` — not in example)
- Storage-specific secrets beyond Supabase (none defined yet)

**Note:** `.env.example` should eventually gain Paystack / Firebase / Resend placeholders when Phase 3B starts — ask before updating.

---

## 6. Deployment Status

| Item | Status |
| --- | --- |
| Dockerfile / compose | **Absent** |
| Coolify config in repo | **Absent** |
| `.github/workflows` | **Absent** |
| Documented target | Blueprint mentions **Vercel** (`docs/DEPLOYMENT.md`) — Coolify not wired |
| Node engines field | **None** in `package.json` |
| Local Node | `v25.9.0` (likely newer than typical deploy images; pin later) |
| Build command (from package.json) | `prisma generate && next build` |
| Health | `/health` present |
| Readiness | `/readiness` present |
| Version | `/version` present |

Cannot verify Coolify server, SSH, or live env stores without Coolify URL / credentials.

---

## 7. Permission Status

| Surface | Authenticated? | Sufficient for Zolanzo sync? |
| --- | --- | --- |
| GitHub (`gh`) | Accounts present, **tokens invalid** | **No** |
| Supabase MCP | Yes — Bam Signal org | **Org yes / Zolanzo project no** |
| Storage (on BamSignal-Engine) | Readable via SQL | **Wrong project** — do not use |
| Auth dashboard (Site URL / redirects) | Not verified | **Blocked** — need Zolanzo project |
| Database migrations | No writable Zolanzo DB | **Blocked** |
| Cursor → GitHub/Supabase under one admin | Intended (`bamsignalhq`) | **Needs re-auth + project creation** |

---

## 8. Problems Found

1. **No git history / no `origin`** — nothing can flow Local → GitHub → CI.  
2. **GitHub CLI tokens expired** for both `marykberry555` and `bamsignalhq`.  
3. **No dedicated Zolanzo Supabase project** under the visible Bam Signal org.  
4. **MCP currently sees only BamSignal-Engine** — must not be used as Zolanzo DB.  
5. **Local DB URL is localhost `mydb`**, access denied; not Supabase pooler/direct.  
6. **Core Supabase / security env vars missing** from local `.env`.  
7. **No Supabase CLI link** (`supabase/` directory missing).  
8. **No CI, Docker, or Coolify** artifacts in the repository.  
9. **Auth Site URL / redirect allow-list** cannot be verified until project + `NEXT_PUBLIC_APP_URL` exist.  
10. **Storage buckets** for Zolanzo are constants-only; not provisioned on any Zolanzo project.  
11. **`.cursor/` not gitignored** — risk of committing agent clutter on first commit.  
12. **Node 25** locally vs unspecified deploy runtime — pin before production.

---

## 9. Recommended Fixes (manual — not executed)

### A. GitHub (canonical: bamsignalhq)

1. Re-authenticate: `gh auth login` / `gh auth refresh -h github.com` as **bamsignalhq**.  
2. Create empty repo (e.g. `bamsignalhq/zolanzo` or org-owned).  
3. Add `.cursor/` to `.gitignore` (and confirm no secrets).  
4. Initial commit on `main`, `git remote add origin …`, push.  
5. Decide later whether GitHub Actions will run `npm run verify` + migrate deploy.

### B. Supabase (new Zolanzo project)

1. In **Bam Signal** org, create a **new** project named e.g. `zolanzo-dev` (and later `zolanzo-staging` / `zolanzo-prod`).  
2. **Do not** migrate into `BamSignal-Engine`.  
3. Copy URL + anon + service role into local `.env` / `.env.local` (never commit).  
4. Set `DATABASE_URL` (pooler `:6543`, `pgbouncer=true`) and `DIRECT_URL` (direct `:5432`).  
5. Optionally `supabase link --project-ref <ref>` once `supabase init` is approved.  
6. Apply Prisma migrations with `DIRECT_URL` only after confirmation.  
7. Configure Auth: Site URL = app URL; redirect URLs include `/auth/callback` and `/auth/update-password`.  
8. Create storage buckets matching `constants/storage.ts` + policies (INSERT+SELECT+UPDATE for upserts).

### C. Environment

1. Fill missing required vars listed in §5.  
2. Keep production secrets unchanged until a production project exists.  
3. Confirm whether `.env.example` should gain Paystack / Firebase / Resend placeholders now or at Phase 3B.

### D. Deployment

1. Confirm target: **Coolify** vs **Vercel** vs other.  
2. If Coolify: provide URL, server host, and whether SSH is available for verification.  
3. Add Node engine pin (e.g. 20 or 22 LTS) before first prod image.  
4. Wire health/readiness into the platform health checks.

---

## 10. Production Readiness (infra sync slice)

| Dimension | Score (informal) | Notes |
| --- | ---: | --- |
| Code readiness for first migrate | Medium-High | Prisma migrations ordered and validated |
| GitHub sync | **0%** | No remote / no commits / auth broken |
| Supabase (Zolanzo) sync | **0%** | Project missing |
| Env completeness | **~10%** | Only local `DATABASE_URL` |
| Deployment pipeline | **~5%** | Health routes only; no platform wiring |
| **Overall infra sync** | **~5–10%** | Blocked on account + project decisions |

---

## STOP — Information / access needed

Per instructions: **no guessing, no remote overwrites.** Please reply with:

### GitHub

1. Repository owner (user or org) — confirm **`bamsignalhq`** or another owner?  
2. Desired repo name (e.g. `zolanzo`)?  
3. Default branch (`main`)?  
4. Will GitHub Actions be used later? (yes/no)  
5. After you run `gh auth refresh` as bamsignalhq, confirm Cursor may create the repo + first commit + push.

### Supabase

1. Confirm: create a **new** Zolanzo project (do **not** reuse `BamSignal-Engine`)?  
2. Environment for first project: Development / Staging / Production?  
3. Preferred region (BamSignal-Engine is `eu-west-1` — reuse or choose another)?  
4. Project name / reference once created (or authorize Cursor MCP to `create_project` after cost confirm).  
5. Database password availability when Direct URL is needed (share via secure channel / local `.env` only — never paste into chat if avoidable).

### Deployment

1. Coolify URL (if any) or confirm Vercel / other?  
2. Server hostname/IP + whether SSH verification is in scope?  
3. Confirm production secrets must remain unchanged (yes assumed).

### Environment

1. May Cursor update `.env.example` with missing Phase 3B placeholders?  
2. May Cursor add `.cursor/` to `.gitignore` before the first commit?

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md)  
- [INFRASTRUCTURE_REPORT.md](./INFRASTRUCTURE_REPORT.md)  
- [PHASE_3A_PRODUCTION_READINESS_AUDIT.md](./PHASE_3A_PRODUCTION_READINESS_AUDIT.md)  
- [OBSERVABILITY.md](./OBSERVABILITY.md)  

**Next action after your answers:** execute an agreed sync plan (repo create → env wire → new Supabase project → migrate → auth/storage) with explicit confirmation before each remote-mutating step.
