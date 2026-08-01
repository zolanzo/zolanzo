/**
 * Normalize Sendchamp webhook payloads → delivery lifecycle.
 */

export type SendchampLifecycleStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "rejected"
  | "read"
  | "unknown";

export type NormalizedSendchampEvent = {
  provider: "sendchamp";
  service: "sms" | "whatsapp" | "unknown";
  status: SendchampLifecycleStatus;
  providerRef: string | null;
  phone: string | null;
  occurredAt: string;
  idempotencyKey: string;
  raw: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mapStatus(raw: string): SendchampLifecycleStatus {
  const s = raw.toLowerCase();
  if (s === "queued" || s === "pending") return "queued";
  if (s === "sent" || s === "submitted") return "sent";
  if (s === "delivered" || s === "success") return "delivered";
  if (s === "failed" || s === "undelivered") return "failed";
  if (s === "rejected") return "rejected";
  if (s === "read") return "read";
  return "unknown";
}

export function normalizeSendchampWebhook(
  raw: Record<string, unknown>,
): NormalizedSendchampEvent {
  const nested = asRecord(raw.data);
  const payload = Object.keys(nested).length > 0 ? nested : raw;

  const serviceRaw = String(
    payload.service ?? raw.service ?? payload.channel ?? "sms",
  ).toLowerCase();
  const service: NormalizedSendchampEvent["service"] =
    serviceRaw.includes("whatsapp") || serviceRaw === "wa"
      ? "whatsapp"
      : serviceRaw.includes("sms") || serviceRaw === "sms"
        ? "sms"
        : "unknown";

  const status = mapStatus(String(payload.status ?? raw.status ?? "unknown"));
  const providerRef = String(
    payload.reference ??
      payload.sms_uid ??
      payload.uid ??
      payload.message_id ??
      raw.reference ??
      "",
  );
  const phone = String(
    payload.phone_number ?? payload.phone ?? payload.recipient ?? "",
  );

  return {
    provider: "sendchamp",
    service,
    status,
    providerRef: providerRef || null,
    phone: phone || null,
    occurredAt: new Date().toISOString(),
    idempotencyKey: `sendchamp:${service}:${providerRef || "none"}:${status}`,
    raw: { ...raw, eventVersion: "sendchamp.v1" },
  };
}

export function extractSendchampEventId(
  raw: Record<string, unknown>,
): string {
  return normalizeSendchampWebhook(raw).idempotencyKey;
}
