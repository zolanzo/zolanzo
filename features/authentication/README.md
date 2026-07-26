# features/authentication

## Bounded context
**Identity** — authentication platform only (no business logic).

## Responsibility
Email/password auth via Supabase, sessions, devices, password reset, email verification, provisioning (user + profile + personal org).

## Hard rules
- Auth never imports campaigns/wallet/marketplace.
- Roles live in DB + `app_metadata` — never `user_metadata`.
- Every signup gets one profile + personal organization.

## Status
Sprint 1 Part 2 — production email/password auth implemented. OAuth/MFA later.
