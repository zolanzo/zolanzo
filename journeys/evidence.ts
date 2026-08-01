/**
 * Phase 3B.4 — Surface + wiring evidence collectors (no SQL, no DB edits).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

export function readRepoFile(relativePath: string): string | null {
  const full = join(ROOT, relativePath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

export function fileExists(relativePath: string): boolean {
  return existsSync(join(ROOT, relativePath));
}

export function fileContains(
  relativePath: string,
  needle: string | RegExp,
): boolean {
  const src = readRepoFile(relativePath);
  if (!src) return false;
  return typeof needle === "string" ? src.includes(needle) : needle.test(src);
}

/** Critical action / route surfaces for journeys. */
export const JOURNEY_SURFACES = {
  auth: [
    "features/authentication/actions/auth-actions.ts",
    "features/authentication/services/provisioning.ts",
    "app/auth/callback/route.ts",
    "features/users/actions/profile-actions.ts",
  ],
  org: [
    "features/organizations/actions/org-actions.ts",
    "features/organizations/services/organization-service.ts",
  ],
  marketplaceTask: [
    "features/task-marketplace/actions/marketplace-actions.ts",
    "features/task-marketplace/services/claim-engine.ts",
  ],
  campaign: [
    "features/campaigns/actions/campaign-actions.ts",
    "features/tasks/actions/task-instance-actions.ts",
    "features/assignments/actions/assignment-actions.ts",
    "features/submissions/actions/submission-actions.ts",
    "features/verification/actions/validation-actions.ts",
    "features/verification/actions/review-actions.ts",
  ],
  payment: [
    "features/payments/actions/payment-actions.ts",
    "features/payments/services/payment-platform.ts",
    "app/api/webhooks/paystack/route.ts",
  ],
  settlement: [
    "features/settlements/actions/settlement-actions.ts",
    "features/withdrawals/actions/withdrawal-actions.ts",
    "features/withdrawals/services/withdrawal-service.ts",
  ],
  admin: [
    "app/admin/page.tsx",
    "features/admin/actions/operations-actions.ts",
    "features/admin/services/command-center.ts",
    "features/admin/services/payment-health.ts",
    "features/admin/services/email-health.ts",
    "features/admin/services/communication-health.ts",
    "features/admin/services/storage-health.ts",
  ],
  notifications: [
    "features/notifications/services/notification-hub.ts",
    "features/notifications/services/safe-emit.ts",
    "app/api/webhooks/resend/route.ts",
    "app/api/webhooks/sendchamp/route.ts",
  ],
  storage: [
    "lib/integrations/storage/supabase-adapter.ts",
    "lib/integrations/storage/memory-adapter.ts",
    "features/storage/services/asset-platform.ts",
    "features/storage/services/cleanup.ts",
  ],
} as const;

export const DOMAIN_NOTIFICATION_WIRING = [
  {
    file: "features/authentication/services/provisioning.ts",
    event: "auth.welcome",
  },
  {
    file: "features/organizations/services/organization-service.ts",
    event: "org.invite_member",
  },
  {
    file: "features/payments/services/payment-platform.ts",
    event: "payment.receipt",
  },
  {
    file: "features/payments/services/payment-platform.ts",
    event: "campaign.funded",
  },
  {
    file: "features/task-marketplace/services/claim-engine.ts",
    event: "assignment.received",
  },
  {
    file: "features/settlements/services/settlement-service.ts",
    event: "settlement.completed",
  },
  {
    file: "features/withdrawals/services/withdrawal-service.ts",
    event: "withdrawal.requested",
  },
  {
    file: "features/withdrawals/services/withdrawal-service.ts",
    event: "withdrawal.approved",
  },
  {
    file: "features/withdrawals/services/withdrawal-service.ts",
    event: "withdrawal.completed",
  },
] as const;

export function allSurfacesPresent(paths: readonly string[]): {
  ok: boolean;
  missing: string[];
} {
  const missing = paths.filter((p) => !fileExists(p));
  return { ok: missing.length === 0, missing };
}

export function notificationWiringComplete(): {
  ok: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  for (const item of DOMAIN_NOTIFICATION_WIRING) {
    if (!fileContains(item.file, item.event)) {
      missing.push(`${item.file} → ${item.event}`);
    }
  }
  return { ok: missing.length === 0, missing };
}

export function providerKeysPresent(): {
  paystack: boolean;
  resend: boolean;
  sendchamp: boolean;
} {
  return {
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY?.trim()),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    sendchamp: Boolean(process.env.SENDCHAMP_API_KEY?.trim()),
  };
}

export function productListingMarketplaceExists(): boolean {
  // Product listing / vendor marketplace is not the task work marketplace.
  return (
    fileExists("features/listings/services/listing-service.ts") ||
    fileExists("features/marketplace/services/listing-service.ts") ||
    fileExists("features/moderation/services/moderation-service.ts")
  );
}

export function phoneVerificationServiceExists(): boolean {
  return (
    fileContains(
      "features/authentication/services/auth-service.ts",
      /phone.?verif/i,
    ) || fileExists("features/authentication/services/phone-verification.ts")
  );
}
