/**
 * Integration registry — adapters wired as available.
 *
 * Defaults:
 * - identity → Stankings Passport (unset until wired)
 * - sms → Sendchamp (unset until wired)
 * - evidenceStorage → memory (local/tests; replace with supabase/s3/r2/gcs/azure)
 */

import type { IntegrationRegistry } from "@/lib/integrations/types";
import { memoryEvidenceStorageAdapter } from "@/lib/integrations/evidence/memory-adapter";
import { memoryPaymentAdapter } from "@/lib/integrations/payments/memory-adapter";
import { memoryNotificationAdapter } from "@/lib/integrations/notifications/memory-adapter";
import { memoryAiPlugin } from "@/lib/integrations/ai/memory-plugin";
import { memoryMonitoringAdapter } from "@/lib/integrations/monitoring/memory-adapter";

export const integrationRegistry: IntegrationRegistry = {
  evidenceStorage: memoryEvidenceStorageAdapter,
  payments: [memoryPaymentAdapter],
  notifications: [memoryNotificationAdapter],
  aiPlugins: [memoryAiPlugin],
  monitoring: [memoryMonitoringAdapter],
};
