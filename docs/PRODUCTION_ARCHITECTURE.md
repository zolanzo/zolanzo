# ZOLANZO Production Architecture & Operations Manual

## 1. System Overview

ZOLANZO is an enterprise-grade digital micro-task marketplace and workforce orchestration platform.

### Core Architecture Principles:
- **Unified Authentication**: Single entry point (`/login`) with role-based routing (`/earner/dashboard`, `/hirer/dashboard`, `/lex/staff`, `/lex/auth`).
- **Bank-Grade Escrow Security**: Employer campaign funds are locked in Escrow before campaigns launch and disbursed upon evidence approval.
- **Strict RBAC & Route Protection**: Enforced at the Edge (`proxy.ts`), server components, and database Row-Level Security (RLS).
- **Super Admin Oversight**: Full staff roster management, mandatory reason impersonation audit trail, and real-time monitoring.

---

## 2. Route Architecture & Role Access Matrix

| Route Prefix | Access Level | Authorized Roles | Unauthenticated Redirect |
| :--- | :--- | :--- | :--- |
| `/` | `public` | All | None |
| `/login`, `/signup` | `public` | All | Redirects authenticated users to role home |
| `/onboarding` | `onboarding` | `worker`, `employer` | Skipped for `staff`, `admin`, `super_admin` |
| `/earner/*` | `authenticated` | `worker`, `admin`, `super_admin` | Redirects to `/login` or role home |
| `/hirer/*` | `authenticated` | `employer`, `admin`, `super_admin` | Redirects to `/login` or role home |
| `/lex/staff/*` | `staff` | `staff`, `admin`, `super_admin` | Redirects to `/login` or role home |
| `/lex/auth/*` | `super_admin` | `admin`, `super_admin` | Redirects to `/lex/staff` or `/login` |

---

## 3. Test Accounts & Permanent Credentials

| Role | Email | PIN | Primary Route | Onboarding Status |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `ops@zolanzo.com` | `212523` | `/lex/auth` | **Skipped** |
| **Earner (Worker)** | `usertest@zolanzo.com` | `212523` | `/earner/dashboard` | **Completed** |
| **Hirer (Employer)** | `hiretest@zolanzo.com` | `212523` | `/hirer/dashboard` | **Completed** |

---

## 4. Escrow & Wallet Financial Architecture

1. **Campaign Creation & Lock**:
   - Subtotal = `RewardPerSlot` × `TotalSlots`
   - Platform Fee = `10%` of Subtotal
   - Total Required Lock = `Subtotal` + `PlatformFee`
   - Funds are debited from Hirer Wallet and locked in Escrow.
2. **Earner Evidence Submission**:
   - Earner completes task and submits text/file evidence.
   - Status moves to `AwaitingReview`.
3. **Approval & Instant Disburse**:
   - Hirer approves submission.
   - Reward is released from Escrow directly to Earner Wallet balance.
4. **Campaign Completion / Unused Escrow Refund**:
   - Unused escrow for unfulfilled slots is refunded to Hirer Wallet upon campaign completion.

---

## 5. Security & Compliance Controls

- **Edge Proxy Middleware** ([proxy.ts](file:///Users/stanlex/Documents/zolanzo/proxy.ts)): Evaluates sessions, security headers, correlation IDs, and CSRF cookies before page rendering.
- **PIN Hashing**: 6-digit PINs are hashed using salt before storage (`verifyStoredPin()`). Never stored in plain text.
- **Rate Limiting**: `POST /api/auth/login` is rate-limited to 5 attempts per email/IP per 15-minute window.
- **Audit Logs**: Every login, failed login, impersonation event, escrow lock, and withdrawal is recorded in `audit_logs`.

---

## 6. Environment Variables Reference

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:5432/zolanzo
RESEND_API_KEY=re_your_api_key
TERMII_API_KEY=your_termii_key
TERMII_SENDER_ID=ZOLANZO
```

---

## 7. Automated Test Battery

- **ESLint**: `npm run lint`
- **TypeScript**: `npx tsc --noEmit`
- **E2E Auth Test**: `npx tsx scripts/e2e-real-http-auth.ts`
- **Sprint 3 Acceptance**: `npx tsx scripts/sprint3-acceptance-test.ts`
- **Sprint 4 QA Validation**: `npx tsx scripts/sprint4-acceptance-test.ts`
- **Production Build**: `npm run build`
