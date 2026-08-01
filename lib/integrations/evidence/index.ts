/**
 * Resolve the active evidence storage adapter.
 * Prefers Supabase when service role is configured.
 */

export { getEvidenceStorageAdapter } from "@/lib/integrations/storage";
