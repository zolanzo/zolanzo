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
Resolve via `getEvidenceStorageAdapter()`.

Cloud adapters (Supabase / S3 / R2 / GCS / Azure) plug into `integrationRegistry.evidenceStorage` without changing Submission Engine code.
