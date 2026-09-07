export const CONTACT_MATH_MIN = 1;
export const CONTACT_MATH_MAX = 9;

export type PublicMathChallenge = {
  token: string;
  prompt: string;
  left: number;
  right: number;
};

export function isDigitOneToNine(value: number): boolean {
  return Number.isInteger(value) && value >= CONTACT_MATH_MIN && value <= CONTACT_MATH_MAX;
}

export function expectedMathSum(left: number, right: number): number {
  return left + right;
}

export function parseMathAnswer(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  return Number.parseInt(trimmed, 10);
}
