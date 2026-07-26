/**
 * Integration adapter ports — implement in Phase 2.
 * No third-party SDKs wired here.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, string>;
};

export type SmsMessage = {
  to: string;
  body: string;
};

export type PushMessage = {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type PaymentIntentInput = {
  amountMinor: number;
  currency: string;
  customerRef: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
  /** Domain payment intent public id (PAY-…) */
  paymentPublicId?: string;
  returnUrl?: string;
  purpose?: string;
};

export type PaymentIntentResult = {
  provider: string;
  providerRef: string;
  status: "initiated" | "succeeded" | "failed";
  checkoutUrl?: string | null;
  raw?: Record<string, unknown>;
};

export type PaymentVerificationInput = {
  providerRef: string;
  amountMinor?: number;
  currency?: string;
};

export type PaymentVerificationResult = {
  provider: string;
  providerRef: string;
  verified: boolean;
  status: "succeeded" | "failed" | "pending";
  amountMinor: number;
  currency: string;
  snapshot: Record<string, unknown>;
};

export type NormalizedPaymentEvent = {
  type:
    | "payment.initiated"
    | "payment.succeeded"
    | "payment.failed"
    | "payment.refunded"
    | "payment.chargeback";
  provider: string;
  providerRef: string;
  paymentPublicId?: string | null;
  amountMinor: number;
  currency: string;
  occurredAt: string;
  idempotencyKey: string;
  raw: Record<string, unknown>;
};

export type PaymentWebhookParseResult = {
  validSignature: boolean;
  events: NormalizedPaymentEvent[];
};

export type PaymentCapability =
  | "accepts_payments"
  | "bank_transfers"
  | "refunds"
  | "split_payments"
  | "recurring_billing"
  | "virtual_accounts"
  | "webhooks"
  | "multi_currency"
  | "payouts";

/**
 * Full payment gateway adapter — stubs only until credentials wired.
 * Domain code must never import vendor SDKs.
 */
export type PaymentProviderAdapter = {
  readonly providerKey: string;
  readonly capabilities: readonly PaymentCapability[];
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifyPayment(
    input: PaymentVerificationInput,
  ): Promise<PaymentVerificationResult>;
  parseWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<PaymentWebhookParseResult>;
  normalizeEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null;
  /** Placeholder — not executed in Sprint 12 */
  refundPayment?(input: {
    providerRef: string;
    amountMinor: number;
  }): Promise<{ accepted: false; reason: string }>;
  /** Placeholder — not executed in Sprint 12 */
  createTransfer?(input: {
    amountMinor: number;
    currency: string;
    destinationRef: string;
  }): Promise<{ accepted: false; reason: string }>;
  getTransaction?(providerRef: string): Promise<Record<string, unknown> | null>;
};

/** @deprecated Prefer PaymentProviderAdapter */
export type PaymentProvider = PaymentProviderAdapter & {
  createPayment(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  verifyWebhook(headers: Record<string, string>, body: string): Promise<boolean>;
};

export type AiCompletionInput = {
  model: string;
  prompt: string;
  maxTokens?: number;
};

export type AiCompletionResult = {
  provider: string;
  text: string;
  usage?: Record<string, number>;
};

/**
 * Identity verification (KYC / trust) — not authentication.
 * Default implementation: Stankings Passport.
 */
export type IdentityVerificationLevel =
  | "none"
  | "email"
  | "phone"
  | "identity"
  | "kyc"
  | "business";

export type IdentityVerificationStatus = {
  subjectRef: string;
  level: IdentityVerificationLevel;
  trustScore?: number;
  verified: boolean;
  badges?: string[];
  provider: string;
  updatedAt: string;
};

export type IdentityVerificationStartInput = {
  subjectRef: string;
  kind: "individual_kyc" | "business" | "government_id" | "face_future";
  returnUrl?: string;
  metadata?: Record<string, string>;
};

export type IdentityVerificationProvider = {
  getStatus(subjectRef: string): Promise<IdentityVerificationStatus>;
  startVerification(
    input: IdentityVerificationStartInput,
  ): Promise<{ sessionId: string; redirectUrl?: string }>;
  verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<boolean>;
};

export type EmailProvider = {
  send(message: EmailMessage): Promise<{ id: string }>;
};

export type SmsProvider = {
  send(message: SmsMessage): Promise<{ id: string }>;
};

export type PushProvider = {
  send(message: PushMessage): Promise<{ id: string }>;
};

export type NotificationChannel =
  | "email"
  | "sms"
  | "push"
  | "in_app"
  | "webhook";

export type ChannelCapability =
  | "email"
  | "sms"
  | "push"
  | "in_app"
  | "webhook"
  | "templates"
  | "batch"
  | "priority";

export type ChannelDeliveryInput = {
  channel: NotificationChannel;
  to: string;
  subject?: string;
  bodyText: string;
  bodyHtml?: string;
  title?: string;
  data?: Record<string, string>;
  templateKey?: string;
  variables?: Record<string, string>;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type ChannelDeliveryResult = {
  provider: string;
  providerRef: string;
  status: "delivered" | "queued" | "failed" | "skipped";
  deliveredAt?: string;
  failureReason?: string;
  raw?: Record<string, unknown>;
};

/**
 * Channel adapter — stubs until credentials wired.
 * Domain code must never import vendor SDKs.
 */
export type NotificationChannelAdapter = {
  readonly providerKey: string;
  readonly channels: readonly NotificationChannel[];
  readonly capabilities: readonly ChannelCapability[];
  deliver(input: ChannelDeliveryInput): Promise<ChannelDeliveryResult>;
};

export type AiProvider = {
  complete(input: AiCompletionInput): Promise<AiCompletionResult>;
};

export type AiPluginCapability =
  | "evidence_quality"
  | "fraud_detection"
  | "duplicate_detection"
  | "risk_scoring"
  | "reviewer_assistance"
  | "queue_routing"
  | "moderation_assistance"
  | "prompt_generation"
  | "translation_assistance";

export type AiExtensionPoint =
  | "submission"
  | "validation"
  | "review"
  | "settlement"
  | "withdrawal"
  | "notifications"
  | "operations";

export type AiEntityType =
  | "submission"
  | "validation_report"
  | "review_queue_item"
  | "settlement"
  | "withdrawal"
  | "notification_intent"
  | "operational_command"
  | "user"
  | "campaign";

export type AiRecommendationKind =
  | "approve"
  | "reject"
  | "revise"
  | "escalate"
  | "route"
  | "score"
  | "flag"
  | "assist"
  | "translate"
  | "prompt"
  | "noop";

export type AiStructuredFinding = {
  code: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  evidenceRefs?: readonly string[];
  metadata?: Record<string, unknown>;
};

/**
 * Immutable context passed to plugins — never live domain queries.
 */
export type AiContext = {
  readonly contextId: string;
  readonly extensionPoint: AiExtensionPoint;
  readonly entityType: AiEntityType;
  readonly entityId: string;
  readonly entityPublicId: string | null;
  readonly organizationId: string | null;
  readonly versionSnapshots: Record<string, unknown>;
  readonly submissionSnapshot: Record<string, unknown> | null;
  readonly evidenceSnapshot: Record<string, unknown> | null;
  readonly validationReport: Record<string, unknown> | null;
  readonly reviewFindings: readonly Record<string, unknown>[] | null;
  readonly executionContext: Record<string, unknown>;
  readonly pluginConfiguration: Record<string, unknown>;
  readonly promptVariables: Record<string, string>;
  readonly pluginMetadata: Record<string, unknown>;
  readonly createdAt: string;
};

export type AiPluginResult = {
  pluginId: string;
  pluginKey: string;
  model: string;
  modelVersion: string;
  confidence: number;
  score: number | null;
  recommendation: AiRecommendationKind;
  findings: readonly AiStructuredFinding[];
  evidenceReferences: readonly string[];
  executionDurationMs: number;
  metadata: Record<string, unknown>;
};

export type AiPluginMetadata = {
  key: string;
  displayName: string;
  version: string;
  capabilities: readonly AiPluginCapability[];
  supportedEntityTypes: readonly AiEntityType[];
  supportedExtensionPoints: readonly AiExtensionPoint[];
  priority: number;
  health: "healthy" | "degraded" | "unavailable" | "stub";
  configurationSchema: Record<string, unknown>;
};

/**
 * AI plugin adapter — stubs until live models are wired.
 * Domain code must never import vendor LLM SDKs.
 */
export type AiPluginAdapter = {
  readonly metadata: AiPluginMetadata;
  execute(context: AiContext): Promise<AiPluginResult>;
};

export type ObjectStorageProvider = {
  putObject(params: {
    bucket: string;
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<{ url: string }>;
  getSignedUrl(params: {
    bucket: string;
    key: string;
    expiresInSec: number;
  }): Promise<string>;
};

/** Storage providers for evidence — Submission Package never binds to a vendor. */
export const EVIDENCE_STORAGE_ADAPTERS = [
  "memory",
  "supabase",
  "s3",
  "r2",
  "gcs",
  "azure",
] as const;

export type EvidenceStorageAdapterKey =
  (typeof EVIDENCE_STORAGE_ADAPTERS)[number];

/**
 * Opaque evidence pointer. Business logic stores this — never raw vendor URLs.
 */
export type EvidenceReference = {
  adapter: EvidenceStorageAdapterKey;
  container: string;
  objectKey: string;
  contentType?: string;
};

export type EvidenceStoreInput = {
  container: string;
  objectKey: string;
  body: Uint8Array;
  contentType: string;
  metadata?: Record<string, string>;
};

export type EvidenceStorageAdapter = {
  readonly providerKey: EvidenceStorageAdapterKey;
  store(input: EvidenceStoreInput): Promise<EvidenceReference>;
  resolveUrl(
    ref: EvidenceReference,
    expiresInSec?: number,
  ): Promise<string>;
  remove(ref: EvidenceReference): Promise<void>;
};

export type SearchProvider = {
  index(index: string, id: string, document: Record<string, unknown>): Promise<void>;
  remove(index: string, id: string): Promise<void>;
  query(
    index: string,
    q: string,
    options?: { limit?: number; filters?: Record<string, string> },
  ): Promise<Array<{ id: string; score: number }>>;
};

/**
 * Registry shape for DI in Phase 2.
 */
export type IntegrationRegistry = {
  email?: EmailProvider;
  sms?: SmsProvider;
  push?: PushProvider;
  identity?: IdentityVerificationProvider;
  payments?: PaymentProviderAdapter[];
  /** Preferred notification ports — Notification Hub uses these exclusively */
  notifications?: NotificationChannelAdapter[];
  /** @deprecated Prefer aiPlugins for structured recommendations */
  ai?: AiProvider[];
  /** Preferred AI ports — AI Plugin Platform uses these exclusively */
  aiPlugins?: AiPluginAdapter[];
  storage?: ObjectStorageProvider;
  /** Preferred evidence port — Submission Package uses this exclusively */
  evidenceStorage?: EvidenceStorageAdapter;
  search?: SearchProvider;
};
