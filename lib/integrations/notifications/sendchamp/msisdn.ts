/**
 * Sendchamp SMS MSISDN: digits only, no leading +.
 * Nigerian national numbers (`080…` / `80…`) become `23480…`.
 */

export function normalizeSendchampMsisdn(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("2340") && digits.length === 14) {
    return `234${digits.slice(4)}`;
  }
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0") && digits.length === 11) {
    return `234${digits.slice(1)}`;
  }
  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `234${digits}`;
  }
  return digits;
}

export function isNormalizedMsisdn(input: string): boolean {
  const normalized = normalizeSendchampMsisdn(input);
  return normalized.length >= 11 && normalized.length <= 15;
}
