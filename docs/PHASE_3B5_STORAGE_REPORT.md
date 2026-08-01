# Phase 3B.5 — Storage Platform Report

**Date:** 2026-07-26  
**Status:** Complete (stub-safe; live Supabase Storage when `STORAGE_PROVIDER=supabase` + service role)  
**Constraint honored:** No schema redesign · no business-logic redesign · domain never imports Supabase Storage SDK

---

## Executive summary

Zolanzo now has an **enterprise asset platform** behind `StorageProvider` / `EvidenceStorageAdapter`:

```
Domain / Asset Platform / Submission Engine
              ↓
     StorageProvider  +  EvidenceStorageAdapter
              ↓
   ┌──────────┴──────────┐
MemoryAdapter      SupabaseStorageAdapter
```

Signed upload/download URLs, MIME/size validation, virus-scan hook, image WebP + thumbnails, checksum dedup, soft-delete + retention cleanup, and Command Center **Storage Health** are implemented.

---

## 1. Buckets

| Bucket | Visibility | Asset types |
| --- | --- | --- |
| `public-brand` | public | organization logos |
| `avatars` | public | profile photos |
| `campaign-assets` | private | campaign + marketplace photos |
| `submission-evidence` | private | submission evidence |
| `exports` | private | receipts, invoices, documents |
| `temp-uploads` | private | future media / temp |

Operator SQL checklist: [docs/STORAGE_BUCKET_POLICIES.md](./STORAGE_BUCKET_POLICIES.md)

Evidence container legacy alias `evidence` → canonical `submission-evidence`.

---

## 2. Features

| Feature | Status |
| --- | :---: |
| `StorageProvider` port | ✅ |
| `SupabaseStorageAdapter` | ✅ |
| Memory adapter (tests / local) | ✅ |
| Signed upload URLs | ✅ |
| Signed download URLs | ✅ |
| Private / public buckets | ✅ |
| Image optimization (WebP) | ✅ |
| Thumbnail generation | ✅ |
| Metadata extraction (sharp) | ✅ |
| Content-type validation | ✅ |
| File size validation | ✅ |
| Virus scan hook interface | ✅ (noop default) |
| Deduplication by checksum | ✅ (evidence attach) |
| Soft delete (`.trash/` prefix) | ✅ |
| Retention + scheduled cleanup | ✅ (`storage.cleanup-temp`) |
| Owner / org path isolation | ✅ |
| Storage Health (Command Center) | ✅ |

---

## 3. Security

| Control | How |
| --- | --- |
| Bucket permissions | Public vs private map in `constants/storage.ts`; private reads via signed URLs |
| RLS / policies | Operator checklist in `STORAGE_BUCKET_POLICIES.md` (no Prisma redesign) |
| Owner access | Object keys namespaced `users/{userId}/…` |
| Organization isolation | `orgs/{organizationId}/…` + membership check |
| Signed URL expiration | Default upload 2h · download 15m |
| Content-type restrictions | `ASSET_ALLOWED_MIME` before signed URL / put |
| Oversized files | Per-asset max (profile 5MB · evidence 500MB · default 100MB) |
| Cross-org access | `assertStorageObjectAccess` → `STORAGE_FORBIDDEN` |

---

## 4. Admin — Storage Health

Command Center panel shows:

- Provider mode / key · buckets  
- Evidence item count · uploads today · failures  
- Orphan candidates (memory refs while live)  
- Cleanup cron note · provider status  

---

## 5. Business journey coverage

| Journey | Coverage |
| --- | --- |
| Registration photo | `uploadProfilePhotoAction` → put → `Profile.avatarUrl` |
| Organization logo | signed upload / put to `public-brand` (no logo column — URL returned for callers) |
| Campaign attachment | `campaign_asset` → `campaign-assets` |
| Marketplace listing photos | `marketplace_photo` (task marketplace; product listings still out of scope) |
| Submission evidence | `submission-evidence` via existing attach flow + validation/dedup |
| Admin download | `createSignedDownloadAction` with admin bypass |
| Cleanup | `runStorageCleanup` + hourly cron |

---

## 6. Environment

| Key | Role |
| --- | --- |
| `STORAGE_PROVIDER` | `supabase` (default intent) · `memory` · `s3`/`gcs` (planned) |
| `NEXT_PUBLIC_SUPABASE_URL` | Required for live |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for live server adapter |

Live mode only when `STORAGE_PROVIDER=supabase` **and** service role is configured. Tests force `STORAGE_PROVIDER=memory`.

---

## 7. Tests

| Suite | Coverage |
| --- | --- |
| `storage-platform.test.ts` | MIME/size reject, signed upload, soft delete, unauthorized access, virus hook, checksum, temp cleanup |
| Journey J8 storage step | Now **PASS** (was BLOCKED in 3B.4) |

**Full suite:** **287** tests passed · typecheck clean.

---

## 8. Remaining risks

1. Buckets must be created in the Supabase project (operator step).  
2. Org logo has no DB column (freeze) — URL is returned; persistence is caller-side until a future approved schema change.  
3. Virus scan is a **hook** — noop until a scanner is registered.  
4. Live signed uploads need Supabase Storage enabled + policies applied.  
5. Product listing marketplace photos remain tied to campaign-assets namespace until that product exists.  
6. Large resumable (TUS) uploads are not wrapped yet — signed upload URL path covers standard sizes.

---

## 9. Pilot readiness

| Gate | Status |
| --- | :---: |
| Adapter behind ports | ✅ |
| Evidence path production-ready (with keys) | ✅ |
| Validation + access control | ✅ |
| Cleanup job | ✅ |
| Storage Health | ✅ |
| Unit tests | ✅ |
| Buckets provisioned in Supabase | ⏳ Operator |
| Live service role in staging | ⏳ Operator |

### Verdict

**Phase 3B.5 implementation complete.**  
Storage is the last infrastructure-backed module before closed pilot.

**Recommendation:** Proceed to **3B.6 Closed Pilot** under release-candidate freeze after:

1. Create the six buckets in Supabase  
2. Apply private/public policies from `STORAGE_BUCKET_POLICIES.md`  
3. Confirm staging `STORAGE_PROVIDER=supabase` with service role  

Establish `release/1.0` (or equivalent) — no features, no schema changes; bug fixes only.

---

## STOP
