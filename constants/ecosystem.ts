/**
 * Stankings ecosystem shared services — consumed via adapters only.
 * ZOLANZO remains independently deployable.
 */

export const ECOSYSTEM_SERVICES = [
  {
    id: "stankings_passport",
    label: "Stankings Passport",
    role: "identity_verification",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
  {
    id: "notification_hub",
    label: "Notification Hub",
    role: "email_sms_push",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
  {
    id: "payment_gateway_layer",
    label: "Payment Gateway Layer",
    role: "payments",
    consumers: ["zolanzo", "bayright", "yike"],
  },
  {
    id: "media_service",
    label: "Media Service",
    role: "images_videos_webp",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
  {
    id: "audit_logging_service",
    label: "Audit & Logging Service",
    role: "audit",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
  {
    id: "feature_flag_service",
    label: "Feature Flag Service",
    role: "flags",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
  {
    id: "analytics_service",
    label: "Analytics Service",
    role: "analytics",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
  {
    id: "ai_gateway",
    label: "AI Gateway",
    role: "ai",
    consumers: ["zolanzo", "yike", "bayright", "bamsignal"],
  },
] as const;

export type EcosystemServiceId = (typeof ECOSYSTEM_SERVICES)[number]["id"];

/**
 * Locked platform decisions (Phase 1 close).
 */
export const PLATFORM_DECISIONS = {
  authOwner: "zolanzo",
  identityVerificationProvider: "stankings_passport",
  defaultSmsProvider: "sendchamp",
  smsAccountSource: "yike_sendchamp_account",
  accessPattern: "adapter_ports_only",
  passportEnvKeys: ["STANKINGS_PASSPORT_URL", "STANKINGS_PASSPORT_KEY"],
  sendchampEnvKeys: ["SENDCHAMP_API_KEY", "SENDCHAMP_SENDER_ID"],
} as const;
