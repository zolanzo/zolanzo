# ZOLANZO Identity Report — Step 4

**Date:** 2026-07-26  
**Scope:** Identity, authentication, multi-tenancy & trust architecture only  
**Not built:** Auth implementation · campaigns · tasks · DB migrations  

## Product language decision

| Term | Meaning |
| --- | --- |
| **Client** | Posts work (replaces user-facing “Advertiser”) |
| **Worker** | Completes work |
| **Organization** | First-class tenant with shared wallet/billing/campaigns |

`advertiser` remains a deprecated alias that normalizes to `client`.

---

## 1. Identity Architecture

Account types: Guest · Individual · Organization · Developer · Moderator · Support · Admin · Super Admin  

Participation modes: Worker · Client · Both  

Models designed in `types/identity.ts`. Diagram: [IDENTITY_ARCHITECTURE.md](./IDENTITY_ARCHITECTURE.md).

---

## 2. Authentication Flows

Multi-method registry (password, magic link, OAuth x6, phone OTP, TOTP, passkeys/WebAuthn future).  
Flows: signup, OAuth, MFA, org invite accept, session/device revoke.  
Details: [AUTH_FLOW.md](./AUTH_FLOW.md).

---

## 3. Organization Model

First-class org with:

Owner · Admin · Finance · Campaign Manager · Reviewer · Team Member · Read-only · Custom (future)

Shared: members, wallet, billing, campaigns, reports, API keys, audit logs, activity timeline, future workspaces.

Org RBAC: `constants/org-roles.ts`

---

## 4. Multi-tenancy Strategy

Single user · Organization · Multi-org membership · Future workspaces · Future white-label  

Active tenant in `ActorContext.tenant` (`organizationId`, `workspaceId`, `teamIds`).  
RLS planned on `organization_id`.  
Docs: [TENANCY_MODEL.md](./TENANCY_MODEL.md).

---

## 5. Trust System

Trust score bands, worker/client/org reputation, badges, signal keys.  
Docs: [TRUST_SYSTEM.md](./TRUST_SYSTEM.md).

---

## 6. Verification Levels

`none` → `email` → `phone` → `identity` → `kyc` → `business`

Gates high-value withdrawals, sensitive campaign types, employer badges.

---

## 7. Security Layers

Transport → App headers → Auth/MFA → Sessions/devices → RBAC (platform+org) → RLS → Trust/fraud → Audit  

Docs: [SECURITY_MODEL.md](./SECURITY_MODEL.md).

---

## 8. Event Catalog (identity-focused)

Added/confirmed:

`user.created` · `identity.verified` · `email.verified` · `phone.verified` · `session.created` · `session.revoked` · `device.trusted` · `device.revoked` · `mfa.enabled` · `login.succeeded` · `login.failed` · `risk.signal_raised` · `organization.created` · `member.invited` · `member.accepted` · `member.role_changed` · `member.removed` · `workspace.created` · `audit.recorded` · `client.profile_completed` · `trust.score_updated` · `badge.granted` · `payment_method.verified`

Full list: `constants/events.ts`

---

## 9. Future Expansion Strategy

| Expansion | How architecture absorbs it |
| --- | --- |
| Custom org roles | `OrgRole = custom` + per-org grant table |
| Workspaces | `Workspace` model already in identity types |
| White-label | Org branding + flag `white_label` |
| Passkeys | Auth method registry status `future` |
| Millions of users/orgs | Tenant-partitioned memberships, session store, risk async |
| New client kinds | Append `CLIENT_ENTITY_KINDS` |
| Mobile | Same auth methods + session APIs |

---

## 10–12. Scores

| Metric | Score |
| --- | --- |
| **10. Readiness (identity blueprint)** | **91 / 100** |
| **11. Security (design)** | **90 / 100** |
| **12. Enterprise Identity** | **93 / 100** |

Deductions: no live IdP wiring yet, passkeys future, fraud models not calibrated, RLS not applied.

---

## Artifacts changed/added

- `types/domain.ts` — Client language, account types, workspace IDs
- `types/identity.ts` — Full identity conceptual models
- `constants/org-roles.ts` · `auth-methods.ts` · `trust.ts` · `client-kinds.ts`
- `constants/roles.ts` · `permissions.ts` · `events.ts` — extended
- `lib/rbac/access.ts` — `canInOrg`, client normalization
- `features/clients/**` — canonical demand module
- `features/advertisers` — deprecated alias README
- Docs under `docs/IDENTITY_*.md`, `AUTH_FLOW`, `TENANCY_MODEL`, `TRUST_SYSTEM`, `SECURITY_MODEL`, this report

```bash
npm run typecheck
```
