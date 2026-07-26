# Public IDs

Human-friendly, stable identifiers for support, email, audit, and UI.

Internal primary keys remain `cuid`. Public IDs are **additional** unique columns.

## Catalog

| Entity | Example | Strategy |
| --- | --- | --- |
| Organization | `ORG-9X4P2M` | Random |
| Client | `CLI-8D71KF` | Random |
| Worker | `WRK-3L8NQ2` | Random |
| Campaign | `CMP-2026-000001` | Year + sequence |
| Task Template | `TPL-000127` | Sequence |
| Task | `TSK-8A92KD` | Random |
| Assignment | `ASN-24H7QK` | Random |
| Submission | `SUB-6P1RM8` | Random |
| Wallet | `WAL-000045` | Sequence |
| Transaction | `TXN-20260725-000014` | Date + sequence |
| Withdrawal | `WDR-000832` | Sequence |
| Dispute | `DSP-000041` | Sequence |

Source of truth: `constants/public-ids.ts`

## Generator

**Only** allocate via:

```ts
import { generatePublicId, allocateOrganizationPublicId } from "@/lib/public-id";

await generatePublicId("campaign", { tx: prismaTx });
await allocateOrganizationPublicId(tx);
```

- Random IDs use an unambiguous alphabet (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`).
- Sequential IDs use `public_id_counters` (scoped by year/date when required).
- Never invent formats inside feature modules.

## Current wiring

- `Organization.publicId` — set on personal + business org create
- `Profile.workerPublicId` / `Profile.clientPublicId` — set on signup provisioning
- Sprint 2+ models (templates, campaigns, tasks, …) must include `publicId` at creation

## Rules

See `.cursor/rules/public-ids.mdc`.
