# Authentication Flows

Design-only. Implementation will use Supabase Auth (+ MFA/WebAuthn as available).

## Supported methods (registry)

See `constants/auth-methods.ts`:

| Method | Category | Status |
| --- | --- | --- |
| Email + Password | password | planned |
| Magic Link | passwordless | planned |
| Google, Apple, GitHub, Microsoft, Facebook, LinkedIn | oauth | planned |
| Phone OTP | otp | planned |
| Authenticator (TOTP) | mfa | planned |
| Passkeys / WebAuthn | webauthn | future |

## Primary flows

### A. Email + password signup

```
Guest → Register(email, password)
     → user.created
     → Send verification email
     → email.verified → identity.verified (level: email)
     → Optional: create Worker and/or Client participation
     → Optional: create Organization (Client employer)
```

### B. Magic link

```
Guest → Request magic link → Consume token → session.created
```

### C. OAuth

```
Guest → IdP consent → AuthIdentity linked → session.created
     → If new user: user.created
```

### D. Phone OTP

```
User → Send OTP → Verify → phone.verified
```

### E. MFA challenge

```
Password/OAuth success → If MFA enabled → TOTP/SMS/Passkey
                       → session.created (mfa_satisfied=true)
```

### F. Org invite accept

```
Invite email → Auth (existing or signup) → member.accepted
            → Org context attached to session
```

### G. Session revoke / device trust

```
Logout / admin revoke → session.revoked
Trust device → device.trusted
Revoke device → device.revoked (+ cascade sessions)
```

## Session policy (defaults)

From `features/authentication/constants`:

- Sliding / absolute TTL
- Idle timeout
- MFA required for admin/super_admin
- Concurrent session cap

## Risk hooks (no impl yet)

On `login.succeeded` / `login.failed`:

- Geo anomaly
- New device
- Impossible travel
- Credential stuffing signals → `risk.signal_raised`

High risk → step-up MFA or block.

## Events

`user.created` · `email.verified` · `phone.verified` · `identity.verified` · `session.created` · `session.revoked` · `device.trusted` · `mfa.enabled` · `login.succeeded` · `login.failed` · `risk.signal_raised`
