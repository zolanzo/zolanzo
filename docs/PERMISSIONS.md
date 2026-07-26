# Permissions & RBAC

Sources:

- Platform roles: `constants/roles.ts`
- Org roles: `constants/org-roles.ts`
- Permissions + matrix: `constants/permissions.ts`
- Evaluator: `lib/rbac/access.ts` (`can`, `canInOrg`)
- Feature flags / plan gates: `constants/feature-flags.ts`, `lib/feature-flags/evaluate.ts`

## Accounts & participation

Guest · Individual · Organization · Developer · Moderator · Support · Admin · Super Admin  

Participation: **Worker** · **Client** (legacy alias: Advertiser)

## Platform roles

`guest` · `worker` · `client` · `org_member` · `org_admin` · `moderator` · `support` · `admin` · `super_admin` · `developer` · `api_client`

`advertiser` normalizes to `client`.

## Organization roles

Owner · Admin · Finance · Campaign Manager · Reviewer · Team Member · Read-only · Custom (future)

## Permission matrix (summary)

| Capability area | Worker | Client | Org Admin | Moderator | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Browse marketplace | ✓ | — | — | — | ✓ | ✓ |
| Claim tasks | ✓ | — | — | — | — | ✓ |
| Create/publish campaigns | — | ✓ | ✓ | — | — | ✓ |
| Review submissions | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Wallet read | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Withdraw | ✓ | — | — | — | approve | ✓ |
| Escrow hold | — | ✓ | ✓ | — | ✓ | ✓ |
| Org audit / API keys | — | ✓* | ✓ | — | ✓ | ✓ |
| Moderation | — | — | — | ✓ | ✓ | ✓ |
| KYC review | — | — | — | — | ✓ | ✓ |
| Feature flags | — | — | — | — | ✓ | ✓ |

\* when acting with an appropriate org role

Full grants: `ROLE_PERMISSIONS` + `ORG_ROLE_PERMISSIONS`. `super_admin` / org `owner` = `*`.

## Evaluation algorithm (planned runtime)

1. Resolve platform roles from session + participation  
2. Check `can(actor, permission)`  
3. For org resources: check `canInOrg(actor, orgPermission, membershipRole)`  
4. Enforce tenant scope in repositories (`organization_id`)  
5. Check feature flag + subscription plan gate  
6. Deny by default  

## Authz hard rules (when implementing)

- Store roles in `app_metadata` / membership tables — **never** `user_metadata`
- RLS on every exposed table
- API clients use scoped keys mapped to `api_client` + org

## Feature flags & subscriptions

Plans: `free` → `starter` → `growth` → `business` → `enterprise`

Examples:

- `api.public_v1` requires Business+  
- `white_label` requires Enterprise  
- `ai_labeling.studio` requires Growth+  
