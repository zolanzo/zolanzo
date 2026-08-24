/**
 * Sensitive-field redaction for structured logs.
 * Never log secrets, tokens, PANs, raw webhook bodies, or passwords.
 */

const SENSITIVE_KEY =
  /^(password|passwd|secret|token|authorization|api[_-]?key|private[_-]?key|csrf|cookie|set-cookie|pan|card[_-]?number|cvv|pin|otp|rawBody|webhookBody|database_url|direct_url|service_role|verification_reference|verification_code|business_uid)$/i;

const SENSITIVE_SUBSTRING =
  /(password|secret|token|apikey|api_key|authorization|private_key|csrf|bearer)/i;

export function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key) || SENSITIVE_SUBSTRING.test(key)) {
    return "[REDACTED]";
  }
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 500 && /Bearer\s+/i.test(value)) return "[REDACTED]";
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => redactValue(String(i), item));
  }
  if (typeof value === "object") {
    return redactFields(value as Record<string, unknown>);
  }
  return value;
}

export function redactFields(
  fields: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!fields) return fields;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = redactValue(key, value);
  }
  return out;
}
