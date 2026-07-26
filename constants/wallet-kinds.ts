/**
 * Wallet kinds — who holds value on the platform.
 */

export const WALLET_KINDS = [
  "worker",
  "client",
  "organization",
  "platform",
  "referral",
  "partner",
  "marketplace",
] as const;

export type WalletKind = (typeof WALLET_KINDS)[number];

export const WALLET_KIND_LABELS: Record<WalletKind, string> = {
  worker: "Worker Wallet",
  client: "Client Wallet",
  organization: "Organization Wallet",
  platform: "Platform Wallet",
  referral: "Referral Wallet",
  partner: "Partner Wallet",
  marketplace: "Marketplace Wallet",
};

export const WALLET_STATUSES = [
  "active",
  "frozen",
  "closed",
] as const;

export type WalletStatus = (typeof WALLET_STATUSES)[number];
