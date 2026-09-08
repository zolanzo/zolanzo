import { generateOtpCode, hashOtpCode, verifyOtpCode } from "@/lib/otp/generator";
import { normalizeEmail } from "@/lib/auth/email";
import { withKeyedLock } from "@/lib/auth/keyed-lock";
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_TTL_MS,
  EMAIL_OTP_USER_MESSAGES,
  type EmailOtpPurpose,
} from "@/lib/auth/email-otp-constants";

export type EmailVerificationRow = {
  id: string;
  user_id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  verified_at: string | null;
  consumed_at: string | null;
  purpose: string | null;
  created_at: string;
};

export type ConsumeEmailOtpFailure =
  | "no_active"
  | "expired"
  | "invalid"
  | "already_used"
  | "already_verified"
  | "too_many"
  | "need_new_code";

export type ConsumeEmailOtpResult =
  | { ok: true; id: string; userId: string }
  | { ok: false; reason: ConsumeEmailOtpFailure };

export type EmailOtpStore = {
  invalidateActive(email: string, purpose: EmailOtpPurpose): Promise<void>;
  insertChallenge(params: {
    userId: string;
    email: string;
    purpose: EmailOtpPurpose;
    codeHash: string;
    expiresAt: Date;
  }): Promise<string>;
  supersedeOtherActive(
    email: string,
    purpose: EmailOtpPurpose,
    keepId: string,
  ): Promise<void>;
  loadLatest(
    email: string,
    purpose: EmailOtpPurpose,
    unconsumedOnly: boolean,
  ): Promise<EmailVerificationRow | null>;
  listConsumed(email: string, purpose: EmailOtpPurpose): Promise<EmailVerificationRow[]>;
  incrementAttempts(id: string, attempts: number): Promise<void>;
  markConsumed(
    id: string,
    at: Date,
    verified: boolean,
  ): Promise<{ id: string; userId: string } | null>;
  findLatestConsumedPinReset(email: string): Promise<EmailVerificationRow | null>;
  deleteById(id: string): Promise<void>;
};

export type EmailOtpClock = {
  now(): Date;
};

export const systemClock: EmailOtpClock = {
  now: () => new Date(),
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: string; message?: string; cause?: { code?: string } };
  const code = record.code ?? record.cause?.code;
  const message = record.message ?? "";
  return code === "23505" || code === "P2002" || /duplicate|unique/i.test(message);
}

async function matchesConsumedCode(
  store: EmailOtpStore,
  email: string,
  purpose: EmailOtpPurpose,
  code: string,
): Promise<boolean> {
  return Boolean(await findMatchingConsumedEmailOtpWithStore(store, { email, code, purpose }));
}

export async function findMatchingConsumedEmailOtpWithStore(
  store: EmailOtpStore,
  params: { email: string; code: string; purpose: EmailOtpPurpose },
): Promise<EmailVerificationRow | null> {
  const email = normalizeEmail(params.email);
  const rows = await store.listConsumed(email, params.purpose);
  return (
    rows.find(
      (row) => Boolean(row.code_hash) && verifyOtpCode(params.code, row.code_hash),
    ) ?? null
  );
}

export async function issueEmailOtpWithStore(
  store: EmailOtpStore,
  params: { userId: string; email: string; purpose: EmailOtpPurpose },
  clock: EmailOtpClock = systemClock,
): Promise<string> {
  const email = normalizeEmail(params.email);

  return withKeyedLock(`otp:${email}:${params.purpose}`, async () => {
    await store.invalidateActive(email, params.purpose);

    const otp = generateOtpCode(6);
    const codeHash = hashOtpCode(otp);
    const expiresAt = new Date(clock.now().getTime() + EMAIL_OTP_TTL_MS);

    let challengeId: string;
    try {
      challengeId = await store.insertChallenge({
        userId: params.userId,
        email,
        purpose: params.purpose,
        codeHash,
        expiresAt,
      });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
      }
      await store.invalidateActive(email, params.purpose);
      challengeId = await store.insertChallenge({
        userId: params.userId,
        email,
        purpose: params.purpose,
        codeHash,
        expiresAt,
      });
    }

    await store.supersedeOtherActive(email, params.purpose, challengeId);
    return otp;
  });
}

export async function consumeEmailOtpWithStore(
  store: EmailOtpStore,
  params: { email: string; code: string; purpose: EmailOtpPurpose },
  clock: EmailOtpClock = systemClock,
): Promise<ConsumeEmailOtpResult> {
  const email = normalizeEmail(params.email);
  const code = String(params.code ?? "").replace(/\D/g, "").slice(0, 6);
  const now = clock.now();

  const active = await store.loadLatest(email, params.purpose, true);

  if (!active) {
    if (await matchesConsumedCode(store, email, params.purpose, code)) {
      return { ok: false, reason: "already_used" };
    }
    const latest = await store.loadLatest(email, params.purpose, false);
    if (latest) {
      return { ok: false, reason: "need_new_code" };
    }
    return { ok: false, reason: "no_active" };
  }

  if (new Date(active.expires_at).getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  if ((active.attempts ?? 0) >= EMAIL_OTP_MAX_ATTEMPTS) {
    await store.markConsumed(active.id, now, false);
    return { ok: false, reason: "too_many" };
  }

  if (!verifyOtpCode(code, active.code_hash)) {
    if (await matchesConsumedCode(store, email, params.purpose, code)) {
      return { ok: false, reason: "already_used" };
    }
    await store.incrementAttempts(active.id, (active.attempts ?? 0) + 1);
    return { ok: false, reason: "invalid" };
  }

  const consumed = await store.markConsumed(active.id, now, true);
  if (!consumed) {
    return { ok: false, reason: "already_used" };
  }

  return {
    ok: true,
    id: consumed.id,
    userId: consumed.userId,
  };
}

export async function findPinResetGrantWithStore(
  store: EmailOtpStore,
  email: string,
  clock: EmailOtpClock = systemClock,
): Promise<EmailVerificationRow | null> {
  const row = await store.findLatestConsumedPinReset(normalizeEmail(email));
  if (!row?.consumed_at) return null;
  const consumedAt = new Date(row.consumed_at).getTime();
  if (clock.now().getTime() - consumedAt > EMAIL_OTP_TTL_MS) return null;
  return row;
}

export async function deleteEmailOtpWithStore(
  store: EmailOtpStore,
  id: string,
): Promise<void> {
  await store.deleteById(id);
}

export { EMAIL_OTP_PURPOSE, EMAIL_OTP_TTL_MS, EMAIL_OTP_USER_MESSAGES };
