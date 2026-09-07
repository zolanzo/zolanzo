import "server-only";

import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import {
  CONTACT_MATH_MAX,
  CONTACT_MATH_MIN,
  expectedMathSum,
  isDigitOneToNine,
  parseMathAnswer,
  type PublicMathChallenge,
} from "@/lib/contact/math";

export {
  CONTACT_MATH_MAX,
  CONTACT_MATH_MIN,
  expectedMathSum,
  isDigitOneToNine,
  parseMathAnswer,
  type PublicMathChallenge,
} from "@/lib/contact/math";

export const CONTACT_MATH_TTL_MS = 15 * 60 * 1000;

type ChallengePayload = {
  l: number;
  r: number;
  exp: number;
  n: string;
};

const usedNonces = new Map<string, number>();

export function resolveContactChallengeSecret(
  env: { CSRF_SECRET?: string; WEBHOOK_SIGNING_SECRET?: string; NODE_ENV?: string } = process.env,
): string | null {
  const configured =
    env.CSRF_SECRET?.trim() || env.WEBHOOK_SIGNING_SECRET?.trim() || "";
  if (configured) return configured;
  if (env.NODE_ENV === "production") return null;
  return "zolanzo-dev-contact-math";
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function toPublicChallenge(payload: ChallengePayload, token: string): PublicMathChallenge {
  return {
    token,
    prompt: `What is ${payload.l} + ${payload.r}?`,
    left: payload.l,
    right: payload.r,
  };
}

export function encodeMathChallenge(payload: ChallengePayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function decodeMathChallenge(
  token: string,
  secret: string,
): ChallengePayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, signPayload(encoded, secret))) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as ChallengePayload;
    if (
      !isDigitOneToNine(parsed.l) ||
      !isDigitOneToNine(parsed.r) ||
      typeof parsed.exp !== "number" ||
      typeof parsed.n !== "string" ||
      parsed.n.length < 8
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createMathChallenge(options?: {
  secret?: string;
  nowMs?: number;
  left?: number;
  right?: number;
  nonce?: string;
  ttlMs?: number;
}): PublicMathChallenge | null {
  const secret = options?.secret ?? resolveContactChallengeSecret();
  if (!secret) return null;
  const left = options?.left ?? randomInt(CONTACT_MATH_MIN, CONTACT_MATH_MAX + 1);
  const right = options?.right ?? randomInt(CONTACT_MATH_MIN, CONTACT_MATH_MAX + 1);
  if (!isDigitOneToNine(left) || !isDigitOneToNine(right)) return null;
  const now = options?.nowMs ?? Date.now();
  const payload: ChallengePayload = {
    l: left,
    r: right,
    exp: now + (options?.ttlMs ?? CONTACT_MATH_TTL_MS),
    n: options?.nonce ?? randomBytes(16).toString("hex"),
  };
  return toPublicChallenge(payload, encodeMathChallenge(payload, secret));
}

export function verifyMathAnswer(params: {
  token: string;
  answer: unknown;
  secret?: string;
  nowMs?: number;
}): { ok: true; nonce: string } | { ok: false; reason: "invalid" | "expired" | "mismatch" } {
  const secret = params.secret ?? resolveContactChallengeSecret();
  if (!secret) return { ok: false, reason: "invalid" };
  const payload = decodeMathChallenge(params.token, secret);
  if (!payload) return { ok: false, reason: "invalid" };
  const now = params.nowMs ?? Date.now();
  if (now >= payload.exp) return { ok: false, reason: "expired" };
  const answer = parseMathAnswer(params.answer);
  if (answer === null || answer !== expectedMathSum(payload.l, payload.r)) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true, nonce: payload.n };
}

export function consumeMathNonce(nonce: string, exp: number, nowMs = Date.now()): boolean {
  pruneUsedNonces(nowMs);
  if (usedNonces.has(nonce)) return false;
  usedNonces.set(nonce, exp);
  return true;
}

export function resetMathNonceStoreForTests(): void {
  usedNonces.clear();
}

function pruneUsedNonces(nowMs: number): void {
  for (const [nonce, exp] of usedNonces) {
    if (nowMs >= exp) usedNonces.delete(nonce);
  }
}
