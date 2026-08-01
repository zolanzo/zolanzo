# ZOLANZO — Enterprise Security Audit

**Date:** 2026-07-26  
**Mode:** Read-only product-wide audit (no feature work)  
**Scope:** Auth · RBAC · RLS · Public API · Webhooks · Secrets · OWASP Top 10 · Headers · CSP · Cookies · Dependencies · Leakage  

---

## Executive summary & Scorecard

| Security Metric | Score / Result | Status |
| --- | :---: | --- |
| **Security Score** | **91 / 100** | **Strong Overall Security Posture** |
| **Compliance Readiness** | **88 / 100** | **SOC2 / ISO27001 Aligned** |
| **Enterprise Readiness** | **86 / 100** | **Conditional Production** |

| Risk Category | Count | Primary Impact Areas |
| --- | :---: | --- |
| Critical | **2** | Outbound Webhook SSRF (C1), Dead CSRF Enforcement (C2) |
| High | **7** | API Tenant Binding (H1), Catalog IDOR (H2), Rate Limits (H3), Webhook Replay (H4), JWT Revocation (H5), API Scopes (H6), Dependencies (H7) |
| Medium | **10** | RBAC Divergence, Password Reset, Password Complexity, CSP Nonces, Upload ACL, SVG XSS, Virus Scan Stub, Payment Webhook Action, Audit PII, Skip Env Flag |
| Low | **6** | Email Pixel, Remember-Me Cookie, SameSite Alignment, Permissions Policy, Memory Secrets, Test Secrets |
| Strengths | — | Security headers, Webhook HMAC, RBAC guards, RLS policies, zero secret leakage, parameterized SQL, no XSS sinks |

**Verdict:** Core app authz (feature actions + RLS + service-role discipline) is solid. The highest risk cluster is the **external contract layer** (Public API webhooks/catalog/scopes defaults + outbound SSRF) and **process-local security controls** (rate limit, replay, API keys). Conditional production readiness — close Critical + High cluster before multi-tenant launch.

---

## Critical

### C1 — Outbound webhook SSRF (no private-network block)

| | |
| --- | --- |
| **Area** | Webhooks · Connectors · SSRF (OWASP A10) |
| **Evidence** | `lib/webhooks/subscription-registry.ts` `isValidUrl` allows any `http:`/`https:` URL; `lib/webhooks/delivery-scheduler.ts` `fetch(endpointUrl)` with no IP/DNS allowlist; connectors pass user URLs into the same path |
| **Impact** | Authenticated callers with `webhooks.write` can force the server to request cloud metadata (`169.254.169.254`), localhost, or internal VPC hosts |
| **Recommendation** | HTTPS-only; block loopback/link-local/private RFC1918/CGNAT; disable redirects; optional DNS allowlist; reject literal IPs unless allowlisted |

### C2 — CSRF validation never enforced (broken double-submit design)

| | |
| --- | --- |
| **Area** | CSRF · Cookie policy (OWASP A01/A05) |
| **Evidence** | Middleware sets `zolanzo_csrf` cookie (`middleware.ts`); `validateCsrfToken` exists in `lib/security/csrf.ts` but is **never called** anywhere; cookie is `httpOnly: true`, which prevents JS from reading it for classic double-submit headers |
| **Impact** | Dead CSRF control; if teams assume protection exists, mutating cookie-auth flows may rely only on browser SameSite + Next Origin checks (Server Actions help; raw cookie POST routes may not) |
| **Recommendation** | Either (a) enforce Origin/Referer + SameSite and document “no double-submit”, or (b) use readable CSRF cookie + header validation on mutating routes; never leave unused security code as false assurance |

---

## High

### H1 — Public API webhook mutations lack org ownership (IDOR)

| | |
| --- | --- |
| **Evidence** | Create accepts client `organizationId` override (`lib/public-api/routes/v1.ts` ~428–438); PATCH/DELETE/rotate use subscription `id` only — no `principal.organizationId` match |
| **Impact** | Cross-tenant webhook hijack / secret rotation once store is durable |
| **Recommendation** | Bind create/list/mutate to `principal.organizationId`; ignore body org overrides |

### H2 — Public API catalog has no tenant filter

| | |
| --- | --- |
| **Evidence** | `lib/public-api/services/catalog.ts` list/get helpers are global; scopes checked in gateway, org isolation not applied |
| **Impact** | Architectural IDOR when catalog is backed by real DB |
| **Recommendation** | Scope every list/get by principal org (staff override explicit) |

### H3 — Rate limiting is process-local (Redis unused)

| | |
| --- | --- |
| **Evidence** | `lib/security/rate-limit.ts` — `MemoryRateLimitStore` only; `RATE_LIMIT_REDIS_URL` validated/probed but never wired |
| **Impact** | Multi-instance auth/API quota bypass |
| **Recommendation** | Redis (or equivalent) store before horizontal scale |

### H4 — Webhook replay cache is process-local

| | |
| --- | --- |
| **Evidence** | `lib/security/webhook-auth.ts` in-memory `replayCache` |
| **Impact** | Cross-instance replay within skew window |
| **Recommendation** | Shared Redis/DB TTL store + domain idempotency |

### H5 — Session revoke does not invalidate live Supabase JWT

| | |
| --- | --- |
| **Evidence** | App `sessions.revokedAt` updated on revoke; `getAuthContext()` only uses `supabase.auth.getUser()` — never checks revoked app session rows (`lib/auth/session.ts` ~142–162) |
| **Impact** | “Sign out everywhere” incomplete; stolen JWT valid until expiry |
| **Recommendation** | Bind request auth to non-revoked session row and/or Supabase admin sign-out / refresh rotation |

### H6 — API keys / OAuth clients default to all scopes

| | |
| --- | --- |
| **Evidence** | `lib/public-api/auth/api-keys.ts` / `oauth.ts` — empty scopes → `[...PUBLIC_API_SCOPES]`; in-memory stores |
| **Impact** | Over-privileged credentials by default |
| **Recommendation** | Least-privilege defaults; explicit grants; persist hashed secrets |

### H7 — Dependency vulnerabilities (`npm audit`)

| | |
| --- | --- |
| **Evidence** | `npm audit` (2026-07-26): **16** issues (15 high, 1 moderate) — notably `minimatch`/`brace-expansion` via eslint toolchain; `next`→`postcss` path traversal advisory; `sharp`/libvips CVEs; `valibot` via `@prisma/dev` |
| **Impact** | Mostly **dev/toolchain** exposure; runtime Next/sharp advisories need tracked upgrades (avoid blind `audit fix --force`) |
| **Recommendation** | CI `npm audit`; upgrade eslint 10 / Next patch line carefully; separate prod lockfile audit from devDependencies |

---

## Medium

### M1 — Middleware admin gate uses JWT `app_metadata.roles`, not DB RBAC
Edge check (`middleware.ts`) vs Prisma roles in `requirePermission` — source-of-truth divergence.

### M2 — Password reset may leak email existence
`features/authentication/services/auth-service.ts` can surface Supabase errors instead of always-success.

### M3 — Weak password policy
Min length 8, no complexity (`features/authentication/validators/auth.ts`).

### M4 — CSP nonce generated but not consumed by App Router layout
`middleware.ts` sets nonce + CSP; `app/layout.tsx` does not pass nonce to scripts — verify production CSP does not break or silently weaken.

### M5 — Signed upload accepts arbitrary `organizationId`
`features/storage/services/asset-platform.ts` builds `orgs/${organizationId}/…` without membership assert on sign — namespace pollution risk.

### M6 — SVG allowed on public brand bucket
`constants/storage.ts` / `organization_logo` — stored XSS risk if SVG served executable.

### M7 — Virus scan hook is noop
`lib/integrations/storage/virus-scan.ts` always clean.

### M8 — Unauthenticated payment webhook server action
`handlePaymentWebhookAction` has no session auth (signature still verified) — duplicate surface vs HTTP route.

### M9 — Audit logs store email PII
Login/reset audit metadata includes raw email.

### M10 — `SKIP_ENV_VALIDATION` escape hatch
Must refuse in production/staging.

---

## Low

### L1 — Email open pixel unauthenticated
Anyone with open key can spoof opens (`app/api/email/open/route.ts`).

### L2 — Remember-me cookie is a flag, not Supabase TTL control
Align docs with Supabase session settings.

### L3 — Cookie SameSite inconsistency
CSRF cookie `strict` vs org/remember often `lax`.

### L4 — Permissions-Policy disables geolocation globally
May conflict with GPS evidence product needs.

### L5 — In-memory plaintext webhook delivery secrets
Hashed at rest in subscription record; plaintext Map for delivery — encrypt with KMS for production.

### L6 — No live secret leakage in repo
`.env.example` placeholders only; test `sk_test_*` strings are unit-test fixtures — **OK**.

---

## Strengths (keep)

| Control | Evidence |
| --- | --- |
| Security headers | HSTS, XFO DENY, nosniff, Referrer-Policy, COOP/CORP — `lib/security/headers.ts` |
| CSP baseline | `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `upgrade-insecure-requests` |
| Ingress webhook HMAC | Timestamp skew + constant-time compare + rotation secrets — `lib/security/webhook-auth.ts` |
| Domain RBAC | `requirePermission` / `requireOrgPermission` — `lib/rbac/guards.ts` |
| RLS | Policies enabled (`prisma/migrations/20260726070000_rls_policies`) |
| SQL injection | No `$queryRawUnsafe` / no `dangerouslySetInnerHTML` found |
| Log redaction | `lib/observability/redact.ts` covers secrets/tokens |
| Env validation | Strict keys for staging/production — `lib/validation/env.ts` |
| Public API scopes | Gateway `requireScopes` before handlers |
| Connector isolation (intent) | Marketplace runtime uses Public API + Webhooks only (SSRF still applies to registered URLs) |

---

## Area checklist

| Area | Status | Notes |
| --- | :---: | --- |
| Authentication | ⚠️ | Supabase solid; revoke gap; weak password policy |
| Authorization / RBAC | ✅ | Feature guards strong; middleware role source diverges |
| RLS | ✅ | Deployed; service-role bypass expected for Prisma |
| API scopes | ⚠️ | Enforced; defaults too broad; tenant binding missing |
| Webhook signatures (ingress) | ✅ | HMAC + skew + replay (local) |
| Webhook signatures (egress) | ✅ | HMAC headers designed; SSRF on destination |
| Secrets | ✅ | No repo leakage; CSRF_SECRET required in strict env |
| Encryption / hashing | ✅ | API key SHA-256; passwords via Supabase |
| Rate limiting | ⚠️ | Present; memory-only |
| Session handling | ⚠️ | HttpOnly/Secure patterns; revoke incomplete |
| Audit logs | ⚠️ | Written; email PII |
| PII exposure | ⚠️ | Audit + demo catalog |
| IDOR | ⚠️ | Domain OK; Public API weak |
| SSRF | ❌ | Critical on outbound webhooks |
| CSRF | ❌ | Cookie set; validation unused |
| XSS | ✅ | No HTML sinks; SVG residual |
| SQL Injection | ✅ | Parameterized |
| File uploads | ⚠️ | MIME/size OK; org ACL on sign weak; SVG |
| Storage permissions | ✅/⚠️ | Public vs private mapped; upload org pollution |
| Automation permissions | ✅ | Advisory actions; in-memory |
| Connector isolation | ⚠️ | No internal imports; SSRF via URLs |
| OAuth / API Keys | ⚠️ | Hashed; memory; all-scopes default |

---

## OWASP Top 10 mapping

| OWASP | Rating | Primary findings |
| --- | :---: | --- |
| A01 Broken Access Control | **High** | H1, H2, H5, M1, M5 |
| A02 Cryptographic Failures | **Low** | Acceptable hashing; L5 memory secrets |
| A03 Injection | **Low** | SQLi/XSS sinks clean; M6 SVG |
| A04 Insecure Design | **High** | H3, H4, H6, C2 |
| A05 Security Misconfiguration | **High** | C2, M4, M10, H7 |
| A06 Vulnerable Components | **Medium** | H7 `npm audit` |
| A07 Identification/Auth Failures | **Medium** | H5, M2, M3, H3 |
| A08 Software/Data Integrity | **Low** | Ingress HMAC strong |
| A09 Logging/Monitoring Failures | **Medium** | M9 PII in audit |
| A10 SSRF | **Critical** | C1 |

---

## Security headers · Cookie · CSP

| Control | Status |
| --- | --- |
| HSTS / X-Frame-Options / nosniff / Referrer-Policy | ✅ Applied in middleware |
| Permissions-Policy | ✅ Present (geolocation blocked — product trade-off) |
| CSP | ⚠️ Built with nonce; layout wiring unverified |
| CSRF cookie | ⚠️ Set; httpOnly breaks double-submit; not validated |
| Session cookies | ✅ Supabase SSR + Secure in production patterns |
| Active-org / remember cookies | ⚠️ Lax SameSite; remember is flag only |

---

## Dependency vulnerabilities

```text
npm audit (2026-07-26): 16 vulnerabilities (15 high, 1 moderate)
```

- Toolchain: eslint / minimatch / brace-expansion DoS chain  
- Runtime-adjacent: Next nested `postcss` advisory; `sharp` libvips CVEs  
- Prisma tooling: `valibot` via `@prisma/dev`  

**Do not** blindly `npm audit fix --force` (suggested Next downgrade is unsafe). Track targeted upgrades in CI.

---

## Secret leakage

| Check | Result |
| --- | --- |
| Live `sk_live` / embedded API keys in source | **None found** |
| `.env.example` | Placeholders only |
| Unit-test secrets | Explicitly test-only strings |

---

## Recommendations (priority order)

1. **Block SSRF** on webhook/connector endpoint URLs (C1).  
2. **Enforce org ownership** on Public API webhooks + catalog (H1, H2).  
3. **Wire Redis** (or equivalent) for rate limit + webhook replay (H3, H4).  
4. **Fix CSRF story** — enforce or remove dead code; fix httpOnly vs double-submit (C2).  
5. **Bind session revoke** to live auth checks (H5).  
6. **Least-privilege API scopes** + durable hashed credential store (H6).  
7. **CI dependency audit** + careful Next/eslint upgrades (H7).  
8. Always-success password reset; stronger passwords (M2, M3).  
9. Membership checks on signed uploads; disallow public SVG (M5, M6).  
10. Redact emails in audit metadata; forbid `SKIP_ENV_VALIDATION` in prod (M9, M10).  
11. Verify CSP nonce with App Router scripts (M4).  
12. Require real virus scanning in staging/production (M7).

---

## Implementation report

1. **Features:** none (audit only)  
2. **Created:** this document  
3. **Modified:** none  
4. **Database:** none  
5. **Routes:** none  
6. **Env:** none  
7. **Security:** findings documented; no remediations applied in this mission  
8. **Performance:** n/a  
9. **Tests:** n/a  
10. **TODOs:** remediation backlog above  
11. **Production readiness:** **Conditional** — close Critical + High cluster before public multi-tenant API traffic  

**STOP**
