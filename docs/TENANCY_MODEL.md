# Tenancy Model

Organizations are **first-class** from day one.

## Tenancy modes

| Mode | Description |
| --- | --- |
| Single user | Individual Worker and/or Client; personal wallet |
| Organization | Shared wallet, billing, campaigns, members |
| Multi-org | One user can belong to many organizations |
| Workspaces (future) | Sub-partitions inside an org |
| White-label (future) | Custom domain + branding per org |

## Organization capabilities

- Invite members
- Assign org roles: **Owner · Admin · Finance · Campaign Manager · Reviewer · Team Member · Read-only** (+ custom later)
- Shared wallet
- Shared billing
- Shared campaigns
- Shared reports / analytics
- Shared API keys
- Audit logs + activity timeline
- Future workspaces

## Org RBAC

Source: `constants/org-roles.ts`

| Role | Highlights |
| --- | --- |
| Owner | Full org control (`*`) |
| Admin | Members, campaigns, API keys, audit (not necessarily billing spend) |
| Finance | Billing, wallet spend, reports |
| Campaign Manager | Create/publish campaigns, review submissions |
| Reviewer | Review submissions |
| Team Member | Contribute to campaigns |
| Read-only | View campaigns/reports |
| Custom | Per-org grants (future) |

Platform RBAC (`constants/roles.ts`) answers “what can this user do on ZOLANZO?”  
Org RBAC answers “what can they do **inside this organization**?”

Both must pass for org-scoped actions (`can` + `canInOrg`).

## Data ownership rules (planned)

| Resource | Owner scope |
| --- | --- |
| Campaign / Task | `organization_id` (required for org clients; optional personal client) |
| Shared wallet | `organization_id` |
| Personal worker wallet | `user_id` |
| API keys | `organization_id` or developer user |
| Audit log | `organization_id` |

## Membership lifecycle

```
member.invited → member.accepted → (optional) member.role_changed → member.removed
```

## Multi-org UX (planned)

- Org switcher in dashboard shell topbar
- Active `organizationId` (+ future `workspaceId`) in ActorContext.tenant
- RLS: `organization_id = auth org claim`

## White-label / workspaces

Flag-gated (`white_label`, future workspace flags). Schema includes `Workspace` model now so retrofit is unnecessary.
