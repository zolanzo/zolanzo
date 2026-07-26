# ZOLANZO System Architecture

> Step 3 blueprint. No pages, auth implementation, DB wiring, or business logic.

## North star

ZOLANZO is a **Human Workforce Marketplace** — an operating system for work.

Companies post **campaigns** of many types (app testing, AI labeling, translation, mystery shopping, lead calls, custom human tasks…). Workers discover, claim, submit, and get paid. New campaign types register into a **type registry** — they are not new products.

## Layered architecture

```
┌─────────────────────────────────────────────────────────────┐
│  app/ (App Router)  — routes compose layouts + features     │
├─────────────────────────────────────────────────────────────┤
│  components/        — design system, shells, templates      │
├─────────────────────────────────────────────────────────────┤
│  features/*         — bounded contexts (DDD modules)        │
│    components · hooks · services · repositories             │
│    types · constants · validators                           │
├─────────────────────────────────────────────────────────────┤
│  services/ · repositories/ (shared bases)                   │
├─────────────────────────────────────────────────────────────┤
│  lib/  events · rbac · feature-flags · supabase · prisma    │
├─────────────────────────────────────────────────────────────┤
│  constants/  campaign-types · permissions · events · flags  │
├─────────────────────────────────────────────────────────────┤
│  workers/ · jobs/ · emails/  — async side effects           │
├─────────────────────────────────────────────────────────────┤
│  Postgres (Supabase) + Object Storage + Queue (future)      │
└─────────────────────────────────────────────────────────────┘
```

## Operating system metaphor

| OS concept | ZOLANZO |
| --- | --- |
| Kernel | Campaign + Task + Assignment + Submission + Wallet |
| Processes | Campaign types (plugins via registry) |
| Users | Workers, Advertisers, Orgs, Admins, API clients |
| Permissions | RBAC + org scope + feature flags + plan gates |
| Filesystem | Submissions / datasets / proofs (storage) |
| IPC | Domain events |
| Shell | Dashboard / Admin / Marketing layouts |

## Core work graph

```
Organization ──owns──► Campaign (typeId → registry)
                          │
                          ▼
                        Task[]
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
      Application   Assignment    Marketplace listing
                            │
                            ▼
                       Submission
                            │
                            ▼
                      Verification ──► Escrow release ──► Wallet credit
```

## Non-negotiables

1. **Never duplicate UI** — extend `components/ui` and templates.
2. **Campaign types are data/plugins** — not new feature folders per social network forever; vertical folders (ai-labeling, testing…) hold specialized UX/validators, while `campaigns` remains the aggregate.
3. **Event-driven side effects** — money, notifications, analytics subscribe to events.
4. **RLS + app_metadata for authz** when auth lands (never `user_metadata`).
5. **API-first** — `features/api` owns public contracts; web is a client.

## Related docs

- [FEATURE_MAP.md](./FEATURE_MAP.md)
- [DOMAIN_MODEL.md](./DOMAIN_MODEL.md)
- [EVENTS.md](./EVENTS.md)
- [PERMISSIONS.md](./PERMISSIONS.md)
- [ROADMAP.md](./ROADMAP.md)
- [ARCHITECTURE_REPORT.md](./ARCHITECTURE_REPORT.md)
