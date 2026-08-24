/**
 * External integration catalog — adapter ports only.
 * Implementations land in Phase 2 behind these contracts.
 */

export const INTEGRATION_CATEGORIES = [
  "auth_oauth",
  "identity_verification",
  "email",
  "sms",
  "push",
  "payments",
  "storage",
  "ai",
  "analytics",
  "observability",
  "search",
  "webhooks",
] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];

export type IntegrationDefinition = {
  id: string;
  label: string;
  category: IntegrationCategory;
  status: "planned" | "future" | "optional" | "default";
  /** Env var prefix / keys documented in .env.example later */
  envKeys: readonly string[];
  /** When true, this is the preferred default implementation for its category */
  isDefault?: boolean;
};

export const INTEGRATION_CATALOG: readonly IntegrationDefinition[] = [
  // Platform core
  {
    id: "supabase",
    label: "Supabase",
    category: "auth_oauth",
    status: "planned",
    envKeys: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  // Identity verification (not authentication)
  {
    id: "stankings_passport",
    label: "Stankings Passport",
    category: "identity_verification",
    status: "default",
    isDefault: true,
    envKeys: [
      "STANKINGS_PASSPORT_URL",
      "STANKINGS_PASSPORT_KEY",
    ],
  },
  // OAuth
  {
    id: "google_oauth",
    label: "Google OAuth",
    category: "auth_oauth",
    status: "planned",
    envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    id: "github_oauth",
    label: "GitHub OAuth",
    category: "auth_oauth",
    status: "planned",
    envKeys: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  },
  {
    id: "apple_oauth",
    label: "Apple OAuth",
    category: "auth_oauth",
    status: "planned",
    envKeys: ["APPLE_CLIENT_ID", "APPLE_CLIENT_SECRET"],
  },
  {
    id: "microsoft_oauth",
    label: "Microsoft OAuth",
    category: "auth_oauth",
    status: "planned",
    envKeys: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
  },
  {
    id: "linkedin_oauth",
    label: "LinkedIn OAuth",
    category: "auth_oauth",
    status: "planned",
    envKeys: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  },
  // Email
  {
    id: "resend",
    label: "Resend",
    category: "email",
    status: "default",
    isDefault: true,
    envKeys: ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET"],
  },
  {
    id: "sendgrid",
    label: "SendGrid",
    category: "email",
    status: "optional",
    envKeys: ["SENDGRID_API_KEY"],
  },
  {
    id: "smtp",
    label: "SMTP",
    category: "email",
    status: "optional",
    envKeys: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"],
  },
  // SMS — default: YIKE Sendchamp account via adapter
  {
    id: "sendchamp",
    label: "Sendchamp",
    category: "sms",
    status: "default",
    isDefault: true,
    envKeys: [
      "SENDCHAMP_API_KEY",
      "SENDCHAMP_API_BASE_URL",
      "SENDCHAMP_SENDER_ID",
      "SENDCHAMP_WHATSAPP_SENDER",
      "SENDCHAMP_WEBHOOK_SECRET",
    ],
  },
  {
    id: "twilio",
    label: "Twilio",
    category: "sms",
    status: "optional",
    envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"],
  },
  {
    id: "termii",
    label: "Termii",
    category: "sms",
    status: "optional",
    envKeys: ["TERMII_API_KEY", "TERMII_SENDER_ID"],
  },
  {
    id: "infobip",
    label: "Infobip",
    category: "sms",
    status: "future",
    envKeys: ["INFOBIP_API_KEY", "INFOBIP_BASE_URL"],
  },
  // Push
  {
    id: "firebase_push",
    label: "Firebase Push",
    category: "push",
    status: "planned",
    envKeys: ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"],
  },
  {
    id: "fcm",
    label: "FCM",
    category: "push",
    status: "planned",
    envKeys: ["FCM_SERVER_KEY"],
  },
  // Payments
  {
    id: "paystack",
    label: "Paystack",
    category: "payments",
    status: "default",
    isDefault: true,
    envKeys: ["PAYSTACK_SECRET_KEY", "PAYSTACK_PUBLIC_KEY"],
  },
  {
    id: "stripe",
    label: "Stripe",
    category: "payments",
    status: "planned",
    envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  },
  {
    id: "flutterwave",
    label: "Flutterwave",
    category: "payments",
    status: "planned",
    envKeys: ["FLUTTERWAVE_SECRET_KEY"],
  },
  {
    id: "monnify",
    label: "Monnify",
    category: "payments",
    status: "optional",
    envKeys: ["MONNIFY_API_KEY", "MONNIFY_SECRET_KEY", "MONNIFY_CONTRACT_CODE"],
  },
  // AI
  {
    id: "openai",
    label: "OpenAI",
    category: "ai",
    status: "planned",
    envKeys: ["OPENAI_API_KEY"],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    category: "ai",
    status: "planned",
    envKeys: ["ANTHROPIC_API_KEY"],
  },
  {
    id: "google_gemini",
    label: "Google Gemini",
    category: "ai",
    status: "optional",
    envKeys: ["GOOGLE_AI_API_KEY"],
  },
  {
    id: "supabase_storage",
    label: "Supabase Storage",
    category: "storage",
    status: "default",
    isDefault: true,
    envKeys: [
      "STORAGE_PROVIDER",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
  },
  {
    id: "s3_storage",
    label: "Amazon S3",
    category: "storage",
    status: "planned",
    envKeys: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"],
  },
  // Observability / analytics
  {
    id: "sentry",
    label: "Sentry",
    category: "observability",
    status: "optional",
    envKeys: ["SENTRY_DSN"],
  },
  {
    id: "posthog",
    label: "PostHog",
    category: "analytics",
    status: "optional",
    envKeys: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
  },
  {
    id: "webhook_engine",
    label: "Webhook Engine",
    category: "webhooks",
    status: "planned",
    envKeys: ["WEBHOOK_SIGNING_SECRET"],
  },
] as const;

export type IntegrationId = (typeof INTEGRATION_CATALOG)[number]["id"];
