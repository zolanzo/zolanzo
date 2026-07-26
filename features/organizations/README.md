# features/organizations

## Bounded context
**Tenancy (first-class)**

## Responsibility
Organizations are first-class citizens on ZOLANZO.

Supports:

- Members with org roles: Owner, Admin, Finance, Campaign Manager, Reviewer, Team Member, Read-only (+ custom later)
- Shared wallet, billing, campaigns, reports, API keys
- Audit logs + activity timeline
- Future workspaces + white-label

## Models
See `types/identity.ts` and `features/organizations/constants`.

Org RBAC: `constants/org-roles.ts`

## Status
Architecture scaffold only — **no business logic** in Step 4.
