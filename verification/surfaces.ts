/**
 * Surface evidence for production verification (filesystem path contracts).
 */

import {
  allSurfacesPresent,
  fileContains,
  fileExists,
  providerKeysPresent,
} from "@/journeys/evidence";

export const WORKFLOW_SURFACES = {
  workerSignup: [
    "features/authentication/actions/auth-actions.ts",
    "features/authentication/services/provisioning.ts",
  ],
  organizationSignup: [
    "features/organizations/actions/org-actions.ts",
    "features/organizations/services/organization-service.ts",
  ],
  campaignCreation: [
    "features/campaigns/actions/campaign-actions.ts",
    "features/campaigns/services/campaign-service.ts",
    "features/tasks/services/task-instance-service.ts",
  ],
  assignmentClaim: [
    "features/task-marketplace/actions/marketplace-actions.ts",
    "features/task-marketplace/services/claim-engine.ts",
  ],
  submission: [
    "features/submissions/actions/submission-actions.ts",
    "features/submissions/services/submission-service.ts",
  ],
  review: [
    "features/verification/actions/review-actions.ts",
    "features/verification/services/review-service.ts",
  ],
  approval: [
    "features/verification/services/review-service.ts",
  ],
  settlement: [
    "features/settlements/actions/settlement-actions.ts",
    "features/settlements/services/settlement-service.ts",
  ],
  trustUpdate: [
    "lib/trust/safe-emit.ts",
    "lib/trust/trust-profile-service.ts",
    "lib/trust/calculator.ts",
  ],
  analyticsUpdate: [
    "lib/analytics/safe-emit.ts",
    "lib/analytics/analytics-service.ts",
  ],
  forecastGeneration: [
    "lib/analytics/forecast/forecast-service.ts",
    "lib/analytics/forecast/forecast-engine.ts",
  ],
  reportGeneration: [
    "lib/analytics/reports/report-service.ts",
    "lib/analytics/reports/report-builder.ts",
  ],
  automationTrigger: [
    "lib/automation/automation-service.ts",
    "lib/automation/safe-emit.ts",
  ],
  webhookDelivery: [
    "lib/webhooks/webhook-service.ts",
    "lib/webhooks/delivery-scheduler.ts",
  ],
  connectorExecution: [
    "lib/marketplace/marketplace-service.ts",
    "lib/marketplace/connector-runtime.ts",
  ],
  authentication: [
    "features/authentication/services/auth-service.ts",
    "lib/auth/session.ts",
  ],
  marketplaceDiscovery: [
    "features/task-marketplace/services/marketplace-service.ts",
  ],
  ledger: [
    "features/ledger/services/posting.ts",
  ],
  withdrawal: [
    "features/withdrawals/services/withdrawal-service.ts",
  ],
} as const;

export const INFRA_SURFACES = {
  database: ["lib/prisma/client.ts", "lib/observability/probes.ts"],
  storage: [
    "lib/integrations/storage/supabase-adapter.ts",
    "features/storage/services/asset-platform.ts",
  ],
  email: [
    "features/notifications/services/notification-hub.ts",
    "app/api/webhooks/resend/route.ts",
  ],
  payments: [
    "features/payments/services/payment-platform.ts",
    "app/api/webhooks/paystack/route.ts",
  ],
  sms: ["lib/integrations/notifications/sendchamp/client.ts"],
  whatsapp: ["lib/integrations/notifications/sendchamp/client.ts"],
  forecasts: ["lib/analytics/forecast/forecast-service.ts"],
  reports: ["lib/analytics/reports/report-service.ts"],
  automation: ["lib/automation/automation-service.ts"],
  publicApi: [
    "lib/public-api/gateway.ts",
    "app/api/v1/[[...path]]/route.ts",
  ],
  webhooks: ["lib/webhooks/webhook-service.ts"],
  connectors: ["lib/marketplace/connector-runtime.ts"],
  aiServices: ["lib/ai/config.ts", "lib/ai/types.ts"],
  trustEngine: ["lib/trust/trust-engine.ts"],
  forecastEngine: ["lib/analytics/forecast/forecast-engine.ts"],
  automationEngine: ["lib/automation/automation-service.ts"],
} as const;

export function pathContract(
  paths: readonly string[],
): { ok: boolean; missing: string[] } {
  return allSurfacesPresent(paths);
}

export function settlementNotificationWired(): boolean {
  return fileContains(
    "features/settlements/services/settlement-service.ts",
    "settlement.completed",
  );
}

export function claimNotificationWired(): boolean {
  return fileContains(
    "features/task-marketplace/services/claim-engine.ts",
    "assignment.received",
  );
}

export function reviewDecisionSurface(): boolean {
  return fileContains(
    "features/verification/services/review-service.ts",
    "recordReviewDecision",
  );
}

export { fileExists, fileContains, providerKeysPresent };
