# Feature Map

All product capabilities live under `features/<module>/`.  
UI shells live in `components/`. Routes will compose both later.

## Inventory (44 modules)

| Module | Bounded context | Primary actors |
| --- | --- | --- |
| `authentication` | Identity | All |
| `users` | Identity | All authenticated |
| `organizations` | Tenancy | Client, Org, Admin |
| `teams` | Tenancy | Org |
| `workers` | Supply | Worker |
| `clients` | Demand | Client (posts work) |
| `advertisers` | Demand (deprecated alias) | → `clients` |
| `campaigns` | Work graph | Advertiser, Org |
| `tasks` | Work graph | Advertiser, Worker |
| `task-marketplace` | Work graph | Worker, Guest (browse) |
| `applications` | Work graph | Worker, Advertiser |
| `assignments` | Work graph | Worker, Advertiser |
| `submissions` | Delivery | Worker, Advertiser, Moderator |
| `verification` | Delivery | System, Moderator, Advertiser |
| `wallet` | Money | Worker, Advertiser, Admin |
| `payments` | Money | Advertiser, Org |
| `escrow` | Money | System, Advertiser |
| `withdrawals` | Money | Worker, Admin |
| `rewards` | Growth | Worker, Admin |
| `referrals` | Growth | Worker, Advertiser |
| `notifications` | Comms | All |
| `messaging` | Comms | Worker, Advertiser, Support |
| `ai-jobs` | AI vertical | Advertiser, Worker |
| `ai-datasets` | AI vertical | Advertiser |
| `ai-labeling` | AI vertical | Worker, Advertiser |
| `voice-collection` | AI vertical | Worker, Advertiser |
| `image-annotation` | AI vertical | Worker, Advertiser |
| `video-annotation` | AI vertical | Worker, Advertiser |
| `translation` | Language | Worker, Advertiser |
| `research` | Research | Worker, Advertiser |
| `testing` | QA | Worker, Advertiser |
| `qa` | QA | Worker, Advertiser |
| `bug-reports` | QA | Worker, Advertiser |
| `moderation` | Trust | Moderator, Admin |
| `reports` | Trust | All users |
| `trust-and-safety` | Trust | Admin, Moderator |
| `kyc` | Trust | Worker, Admin |
| `disputes` | Trust | Worker, Advertiser, Admin |
| `admin` | Platform | Admin, Super Admin |
| `analytics` | Platform | Advertiser, Admin |
| `api` | Platform | Developer, API Client |
| `developer-portal` | Platform | Developer |
| `documentation` | Platform | All |
| `support` | Platform | All, Support |
| `settings` | Platform | Authenticated |

## Verticals vs kernel

```
                    ┌─ testing / qa / bug-reports
                    ├─ ai-* / voice / image / video / translation
Campaign kernel ────┼─ research
                    ├─ social campaign types (registry only)
                    └─ custom_human_task (escape hatch)
```

Social networks (Telegram, Discord, …) are **campaign types**, not forever-growing top-level products. Specialized UX can live in vertical features when needed; the aggregate remains `campaigns`.

## Navigation OS (future IA)

Not TaskletPay’s Advertiser/Worker/Admin only — ZOLANZO surfaces:

| Surface | Layout | Features |
| --- | --- | --- |
| Marketing | MarketingLayout | documentation, auth entry |
| Worker OS | DashboardShell | marketplace, assignments, wallet, … |
| Advertiser OS → **Client OS** | DashboardShell | campaigns, tasks, analytics, payments |
| Org OS | DashboardShell | organizations, teams, billing |
| Trust OS | AdminLayout | moderation, kyc, disputes |
| Admin OS | AdminLayout | admin, analytics, flags |
| Developer OS | DocsLayout / Dashboard | api, developer-portal |

## Dependency direction

```
features/*  →  components/* (UI)
features/*  →  lib/*, constants/*, types/*
features/A  →  features/B   (allowed only via published events or shared types — avoid deep service imports)
app/*       →  features/* + components/*
```
