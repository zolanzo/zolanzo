# ZOLANZO — Security Remediation Plan

**Date:** 2026-07-31  
**Mode:** Enterprise security remediation blueprint & roadmap  
**Target:** Critical, High, Medium, and Low security findings  

---

## Executive Summary

| Risk Level | Finding Count | Priority Target | Remediation Phase |
| --- | :---: | --- | --- |
| **Critical** | **2** | Immediate (Pre-Production) | Phase 1 (Blocker Release) |
| **High** | **7** | Short-Term (Sprint 1) | Phase 2 (Public Launch Gate) |
| **Medium** | **10** | Medium-Term (Sprint 2–3) | Phase 3 (Hardening Release) |
| **Low** | **6** | Maintenance Backlog | Phase 4 (Ongoing Hygiene) |

---

## Phase 1: Critical Risk Remediations (Immediate Blockers)

### 1. Outbound Webhook SSRF Prevention (C1)
- **Problem**: Outbound webhook delivery allowed callers to specify internal IPs or cloud metadata endpoints (`169.254.169.254`).
- **Remediation**:
  1. Enforce `https:` scheme on registered webhook subscription URLs.
  2. Implement an IP filter utility in `lib/webhooks/subscription-registry.ts` rejecting private IPv4/IPv6 ranges (RFC 1918, RFC 4193, loopback `127.0.0.1`, link-local `169.254.0.0/16`).
  3. Set `redirect: "error"` in `fetch` requests inside `lib/webhooks/delivery-scheduler.ts` to prevent HTTP redirect SSRF bypasses.

### 2. CSRF Token Enforcement (C2)
- **Problem**: `zolanzo_csrf` cookie was generated in `middleware.ts` but `validateCsrfToken` was un-invoked on mutating routes.
- **Remediation**:
  1. Update mutating Server Actions and API endpoints (`POST`, `PUT`, `DELETE`, `PATCH`) to validate incoming `x-csrf-token` header against active session CSRF state.
  2. Update CSRF cookie settings to non-HttpOnly JavaScript-readable mode if header extraction is required, or rely strictly on Origin/Referer verification for SameSite cookies.

---

## Phase 2: High Risk Remediations (Public Launch Gates)

### 3. Public API Webhook Tenant Binding (H1)
- **Remediation**: In `lib/public-api/routes/v1.ts`, bind all webhook subscription queries (`GET`, `POST`, `PATCH`, `DELETE`) strictly to `principal.organizationId`. Reject client payload overrides.

### 4. Public API Catalog Isolation (H2)
- **Remediation**: In `lib/public-api/services/catalog.ts`, inject tenant filtering into list and get queries based on `principal.organizationId`.

### 5. Redis Rate Limiting & Replay Cache (H3, H4)
- **Remediation**: Wire `RATE_LIMIT_REDIS_URL` in `lib/security/rate-limit.ts` and `lib/security/webhook-auth.ts` to replace process-local memory maps with shared Redis stores.

### 6. Session Revocation JWT Decoupling (H5)
- **Remediation**: In `lib/auth/session.ts`, assert `sessions.revokedAt IS NULL` in `getAuthContext()` before granting access to authenticated routes.

### 7. Explicit API Key & OAuth Least-Privilege Scopes (H6)
- **Remediation**: Default empty scope requests to minimal scope `["campaigns:read"]` rather than full wildcards `[...PUBLIC_API_SCOPES]`.

### 8. Dependency Vulnerability Upgrades (H7)
- **Remediation**: Audit and patch `next`, `postcss`, and `sharp` packages via CI dependency scanners (`npm audit`).

---

## Phase 3: Medium Risk Remediations (Hardening)

- **M1 (Middleware Admin Gate)**: Align middleware JWT role checks with Prisma DB RBAC roles.
- **M2 (Password Reset Enumeration)**: Return uniform success messages regardless of email existence.
- **M3 (Password Policy)**: Enforce 12-character minimum and complexity rules in Zod auth schema.
- **M4 (CSP Nonce)**: Pass CSP nonces to Next.js App Router script tags in `layout.tsx`.
- **M5 (Signed Upload Org ACL)**: Check user organization membership before signing asset upload URLs.
- **M6 (SVG Logo XSS)**: Serve uploaded SVG files with `Content-Type: image/svg+xml` and `Content-Security-Policy: default-src 'none'`.
- **M7 (Virus Scanning)**: Implement ClamAV / AWS GuardDuty virus scanner integration in `virus-scan.ts`.
- **M8 (Payment Webhook Action)**: Deprecate direct server action invocation for payment webhooks; require HTTP route verification.
- **M9 (Audit Log PII)**: Hash or redact user emails in audit log metadata (`lib/observability/redact.ts`).
- **M10 (Skip Env Validation)**: Fail hard if `SKIP_ENV_VALIDATION=true` in `NODE_ENV=production`.

---

## Phase 4: Low Risk Remediations (Hygiene)

- **L1**: Add HMAC signature verification to email open pixel URLs.
- **L2**: Align remember-me cookie duration with Supabase auth refresh token TTL.
- **L3**: Standardize cookie SameSite policies to `Lax` across authentication and organization cookies.
- **L4**: Configure fine-grained `Permissions-Policy` headers allowing GPS where required.
- **L5**: Encrypt in-memory webhook delivery secrets using AWS KMS / Supabase vault secrets.
- **L6**: Maintain automated secret scanning in GitHub Actions CI to prevent credential commits.
