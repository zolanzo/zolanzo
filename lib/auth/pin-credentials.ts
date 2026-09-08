/** Supabase Auth password derived from the 6-digit PIN. Never persist the PIN. */
export function authPasswordFromPin(pin: string): string {
  return `${pin}_ZOLANZO_SECURE_KEY`;
}
