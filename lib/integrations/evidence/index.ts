/**
 * Resolve the active evidence storage adapter.
 */

import { integrationRegistry } from "@/lib/integrations/registry";
import { memoryEvidenceStorageAdapter } from "@/lib/integrations/evidence/memory-adapter";
import type { EvidenceStorageAdapter } from "@/lib/integrations/types";

export function getEvidenceStorageAdapter(): EvidenceStorageAdapter {
  return integrationRegistry.evidenceStorage ?? memoryEvidenceStorageAdapter;
}
