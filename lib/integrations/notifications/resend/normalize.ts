/**
 * Normalize Resend webhook events → delivery lifecycle updates.
 */

export type ResendEmailLifecycleType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked"
  | "email.failed";

export type NormalizedResendEmailEvent = {
  type: ResendEmailLifecycleType | "unknown";
  provider: "resend";
  emailId: string | null;
  to: string | null;
  occurredAt: string;
  idempotencyKey: string;
  bounceType?: string | null;
  raw: Record<string, unknown>;
};

const KNOWN = new Set<string>([
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.opened",
  "email.clicked",
  "email.failed",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function isKnownResendEmailEvent(type: string): boolean {
  return KNOWN.has(type);
}

export function normalizeResendWebhook(
  raw: Record<string, unknown>,
): NormalizedResendEmailEvent {
  const typeRaw = String(raw.type ?? "unknown");
  const data = asRecord(raw.data);
  const emailId =
    typeof data.email_id === "string"
      ? data.email_id
      : typeof data.id === "string"
        ? data.id
        : null;
  const toList = data.to;
  const to = Array.isArray(toList)
    ? String(toList[0] ?? "")
    : typeof toList === "string"
      ? toList
      : null;

  const createdAt =
    typeof data.created_at === "string"
      ? data.created_at
      : new Date().toISOString();

  const bounce = asRecord(data.bounce);
  const type = (isKnownResendEmailEvent(typeRaw)
    ? typeRaw
    : "unknown") as NormalizedResendEmailEvent["type"];

  return {
    type,
    provider: "resend",
    emailId,
    to: to || null,
    occurredAt: createdAt,
    idempotencyKey: `resend:${typeRaw}:${emailId ?? "none"}:${createdAt}`,
    bounceType:
      typeof bounce.message === "string"
        ? bounce.message
        : typeof data.bounce_type === "string"
          ? data.bounce_type
          : null,
    raw: { ...raw, eventVersion: "resend.svix.v1" },
  };
}
