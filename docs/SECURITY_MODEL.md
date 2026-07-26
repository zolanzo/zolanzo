# Security Model

## Layers

1. **Transport** — HTTPS, HSTS (existing middleware headers)
2. **Application** — CSP, CSRF helpers, rate limits (foundation)
3. **Authentication** — multi-method auth + MFA + passkeys-ready
4. **Session** — rotatable sessions, device binding, revoke-all
5. **Authorization** — platform RBAC + org RBAC + feature flags + plan gates
6. **Data** — RLS on tenant rows; secrets never in `user_metadata`
7. **Trust / fraud** — risk signals, KYC, device history, geo checks
8. **Audit** — org audit log + login history

## Verification & recovery

| Control | Purpose |
| --- | --- |
| Email verification | Baseline identity |
| Phone verification | Stronger contact assurance |
| KYC / identity verification | High-trust participation |
| 2FA / TOTP | Account takeover resistance |
| Recovery codes | MFA backup |
| Passkeys / WebAuthn | Phishing-resistant (future) |

## Session & devices

- Session management with absolute + idle TTL
- Trusted devices
- Device history
- Login history
- Geo detection on login
- Risk scoring on auth events
- Fraud detection hooks (`risk.signal_raised`)

## Authz hard rules

1. Never authorize from editable `user_metadata`
2. Store roles/org membership in `app_metadata` and/or tables
3. Short-lived JWTs; validate `session_id` for sensitive ops
4. Service role key server-only
5. Deny by default

## Org security

- Invite-only membership
- Role least-privilege
- API keys scoped to org, rotatable (`api.key_created` / `api.key_revoked`)
- Audit every sensitive mutation (`audit.recorded`)

## Planned entities

`AuthIdentity` · `Session` · `TrustedDevice` · `MfaMethod` · `RecoveryCode` · `LoginHistory` · `RiskSignal` · `OrganizationAuditLog`
