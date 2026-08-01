# Evidence Storage Adapters

Submission Packages never bind to a storage vendor.

```ts
EvidenceReference = {
  adapter: "memory" | "supabase" | "s3" | "r2" | "gcs" | "azure"
  container: string
  objectKey: string
  contentType?: string
}
```

Port: `EvidenceStorageAdapter` in `lib/integrations/types.ts`  
Default: `memoryEvidenceStorageAdapter` (tests/local)  
Live: `supabaseEvidenceStorageAdapter` when `STORAGE_PROVIDER=supabase` + service role  
Resolve via `getEvidenceStorageAdapter()` (`lib/integrations/storage`).

Enterprise object port: `StorageProvider` (signed upload/download, soft delete, list).  
See [PHASE_3B5_STORAGE_REPORT.md](./PHASE_3B5_STORAGE_REPORT.md).

Cloud adapters (Supabase / S3 / R2 / GCS / Azure) plug into the registry without changing Submission Engine code.
