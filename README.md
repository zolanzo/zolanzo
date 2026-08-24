# ZOLANZO

Premium workforce marketplace — enterprise foundation.

> **Scope:** Phase 1 Architecture **closed** (94/100). Phase 2 implementation starts with Sprint 1 — Platform Core.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS 4 · Motion · Lucide · custom theme store (`zolanzo-theme`)
- Supabase · Postgres · Prisma 7
- React Query · Zod · React Hook Form
- Sharp (WebP/AVIF) · PWA-ready

## Getting started

```bash
cp .env.example .env.local
cp .env.example .env
npm install
npm run brand:webp
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Turbopack dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run verify` | validate + typecheck + lint + test + build |
| `npm run brand:webp` | Convert `/public/brand/*.png` → WebP |
| `npm run brand:verify` | Assert PNG + WebP pairs exist |
| `npm run db:generate` | Prisma generate |
| `npm run db:migrate` | Prisma migrate (needs `DIRECT_URL`) |
| `npm run db:seed` | Seed permissions, roles, feature flags |
| `npm run db:validate` | Prisma validate |

## Architecture

```
app/            Next.js App Router (pages, layouts, SEO)
components/     Design system, shells, templates
features/       Domain modules (44) — see docs/FEATURE_MAP.md
hooks/          Shared React hooks
services/       Shared service bases
repositories/   Shared repository bases
lib/            Infrastructure (supabase, prisma, security, images, events, rbac)
providers/      Client providers (theme, react-query, toast)
config/         Non-secret app config
constants/      Brand, tokens, campaign types, permissions, events
types/          Shared + domain types
docs/           System architecture & product blueprint
...
```

### Product blueprint

| Doc | Purpose |
| --- | --- |
| [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) | Layers & OS model |
| [docs/FEATURE_MAP.md](docs/FEATURE_MAP.md) | Module inventory & IA |
| [docs/DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) | Aggregates & relationships |
| [docs/EVENTS.md](docs/EVENTS.md) | Event catalog |
| [docs/PERMISSIONS.md](docs/PERMISSIONS.md) | RBAC & flags |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Build order |
| [docs/ARCHITECTURE_REPORT.md](docs/ARCHITECTURE_REPORT.md) | Architecture scores |
| [docs/IDENTITY_ARCHITECTURE.md](docs/IDENTITY_ARCHITECTURE.md) | Identity platform |
| [docs/AUTH_FLOW.md](docs/AUTH_FLOW.md) | Auth flows |
| [docs/TENANCY_MODEL.md](docs/TENANCY_MODEL.md) | Multi-tenancy |
| [docs/TRUST_SYSTEM.md](docs/TRUST_SYSTEM.md) | Trust & verification |
| [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) | Security layers |
| [docs/IDENTITY_REPORT.md](docs/IDENTITY_REPORT.md) | Step 4 scores |
| [docs/WORK_ENGINE.md](docs/WORK_ENGINE.md) | Work engine kernel |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | End-to-end workflow |
| [docs/TASK_TEMPLATE_SYSTEM.md](docs/TASK_TEMPLATE_SYSTEM.md) | Capabilities + templates |
| [docs/WORK_ENGINE_REPORT.md](docs/WORK_ENGINE_REPORT.md) | Step 5 scores |
| [docs/FINANCIAL_ARCHITECTURE.md](docs/FINANCIAL_ARCHITECTURE.md) | Ledger-first money system |
| [docs/FINANCIAL_REPORT.md](docs/FINANCIAL_REPORT.md) | Step 6 scores |
| [docs/INFRASTRUCTURE.md](docs/INFRASTRUCTURE.md) | Edge, data, cache, queue, storage |
| [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md) | Adapter ports & vendor catalog |
| [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) | Logs, traces, metrics, health |
| [docs/BACKGROUND_JOBS.md](docs/BACKGROUND_JOBS.md) | Queues, jobs, cron |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Env stages & pipeline |
| [docs/API_STRATEGY.md](docs/API_STRATEGY.md) | REST, webhooks, versioning |
| [docs/INFRASTRUCTURE_REPORT.md](docs/INFRASTRUCTURE_REPORT.md) | Step 7 scores |
| [docs/ECOSYSTEM_SERVICES.md](docs/ECOSYSTEM_SERVICES.md) | Passport, Sendchamp, shared services |
| [docs/PHASE_1_ARCHITECTURE_CLOSURE.md](docs/PHASE_1_ARCHITECTURE_CLOSURE.md) | Phase 1 officially closed |
| [docs/SPRINT_1_PART1_REPORT.md](docs/SPRINT_1_PART1_REPORT.md) | Sprint 1 Part 1 implementation |
| [docs/SPRINT_1_PART2_REPORT.md](docs/SPRINT_1_PART2_REPORT.md) | Auth & organization platform |
| [docs/PUBLIC_IDS.md](docs/PUBLIC_IDS.md) | Human-friendly public ID system |
| [docs/TASK_TEMPLATE_ENGINE.md](docs/TASK_TEMPLATE_ENGINE.md) | Work definition platform |
| [docs/SPRINT_2_TASK_TEMPLATE_REPORT.md](docs/SPRINT_2_TASK_TEMPLATE_REPORT.md) | Sprint 2 implementation |
| [docs/RLS.md](docs/RLS.md) | Row Level Security framework |

Demand-side language: **Client** (posts work) · **Worker** (completes work). Organizations are first-class tenants. Work executes on **Assignments**, not Campaigns. Money flows **Campaign → Escrow → Ledger → Wallet** (never Campaign → Wallet). Auth is owned by ZOLANZO; KYC/identity verification is consumed from **Stankings Passport** via adapters. SMS defaults to **Sendchamp** behind `SmsProvider`.

Health: `/health` · `/readiness` · `/version`

## Brand

| Token | Value |
| --- | --- |
| Primary | `#059669` |
| Navy text | `#0F172A` |
| Accent Gold | `#D97706` |
| Background | `#F8FAFC` |
| Dark Background | `#050608` |

Typography: **Plus Jakarta Sans** (headings) · **Inter** (body)

## Security

- Secure headers (HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy)
- Content-Security-Policy (nonce-ready)
- CSRF helpers (double-submit ready)
- Rate limiting layer (in-memory; Redis-ready)
- Zod environment validation

## License

Proprietary — ZOLANZO
