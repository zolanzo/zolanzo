import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export {
  EMAIL_OTP_MAX_ATTEMPTS,
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_TTL_MS,
  EMAIL_OTP_USER_MESSAGES,
  messageForOtpFailure,
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

function adminTable() {
  const admin = createSupabaseAdminClient();
  // Sidecar table — not in generated Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (admin.from("email_verifications") as any);
}

function isUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message ?? "";
  return error?.code === "23505" || /duplicate|unique/i.test(message);
}

export async function invalidateActiveEmailOtps(
  email: string,
  purpose: EmailOtpPurpose,
): Promise<void> {
  const normalized = normalizeEmail(email);
  const { error } = await adminTable()
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", normalized)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  if (error) {
    throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
  }
}

async function insertChallenge(params: {
  userId: string;
  email: string;
  purpose: EmailOtpPurpose;
  codeHash: string;
}): Promise<string> {
  const { data, error } = await adminTable()
    .insert({
      user_id: params.userId,
      email: params.email,
      code_hash: params.codeHash,
      expires_at: new Date(Date.now() + EMAIL_OTP_TTL_MS).toISOString(),
      purpose: params.purpose,
      attempts: 0,
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    throw Object.assign(new Error(EMAIL_OTP_USER_MESSAGES.generic), { cause: error });
  }
  return data.id as string;
}

async function supersedeOtherActive(
  email: string,
  purpose: EmailOtpPurpose,
  keepId: string,
): Promise<void> {
  const { error } = await adminTable()
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .neq("id", keepId);

  if (error) {
    throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
  }
}

export async function issueEmailOtp(params: {
  userId: string;
  email: string;
  purpose: EmailOtpPurpose;
}): Promise<string> {
  const email = normalizeEmail(params.email);

  return withKeyedLock(`otp:${email}:${params.purpose}`, async () => {
    await invalidateActiveEmailOtps(email, params.purpose);

    const otp = generateOtpCode(6);
    const codeHash = hashOtpCode(otp);

    let challengeId: string;
    try {
      challengeId = await insertChallenge({
        userId: params.userId,
        email,
        purpose: params.purpose,
        codeHash,
      });
    } catch (error) {
      const cause = error instanceof Error ? (error as Error & { cause?: { code?: string; message?: string } }).cause : null;
      if (!isUniqueViolation(cause)) {
        throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
      }
      await invalidateActiveEmailOtps(email, params.purpose);
      challengeId = await insertChallenge({
        userId: params.userId,
        email,
        purpose: params.purpose,
        codeHash,
      });
    }

    await supersedeOtherActive(email, params.purpose, challengeId);
    return otp;
  });
}

async function loadLatestChallenge(
  email: string,
  purpose: EmailOtpPurpose,
  unconsumedOnly: boolean,
): Promise<EmailVerificationRow | null> {
  let query = adminTable()
    .select("*")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1);

  if (unconsumedOnly) {
    query = query.is("consumed_at", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
  }
  return (data as EmailVerificationRow | null) ?? null;
}

export async function findMatchingConsumedEmailOtp(params: {
  email: string;
  code: string;
  purpose: EmailOtpPurpose;
}): Promise<EmailVerificationRow | null> {
  const email = normalizeEmail(params.email);
  const { data, error } = await adminTable()
    .select("*")
    .eq("email", email)
    .eq("purpose", params.purpose)
    .not("consumed_at", "is", null)
    .order("consumed_at", { ascending: false })
    .limit(10);

  if (error || !Array.isArray(data)) {
    return null;
  }
  const match = data.find(
    (row: EmailVerificationRow) =>
      Boolean(row.code_hash) && verifyOtpCode(params.code, row.code_hash),
  );
  return (match as EmailVerificationRow | undefined) ?? null;
}

async function matchesConsumedCode(
  email: string,
  purpose: EmailOtpPurpose,
  code: string,
): Promise<boolean> {
  return Boolean(
    await findMatchingConsumedEmailOtp({ email, code, purpose }),
  );
}

export async function consumeEmailOtp(params: {
  email: string;
  code: string;
  purpose: EmailOtpPurpose;
}): Promise<ConsumeEmailOtpResult> {
  const email = normalizeEmail(params.email);
  const code = String(params.code ?? "").replace(/\D/g, "").slice(0, 6);

  const active = await loadLatestChallenge(email, params.purpose, true);

  if (!active) {
    if (await matchesConsumedCode(email, params.purpose, code)) {
      return { ok: false, reason: "already_used" };
    }
    const latest = await loadLatestChallenge(email, params.purpose, false);
    if (latest) {
      return { ok: false, reason: "need_new_code" };
    }
    return { ok: false, reason: "no_active" };
  }

  if (new Date(active.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if ((active.attempts ?? 0) >= EMAIL_OTP_MAX_ATTEMPTS) {
    await adminTable()
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", active.id)
      .is("consumed_at", null);
    return { ok: false, reason: "too_many" };
  }

  if (!verifyOtpCode(code, active.code_hash)) {
    if (await matchesConsumedCode(email, params.purpose, code)) {
      return { ok: false, reason: "already_used" };
    }
    await adminTable()
      .update({ attempts: (active.attempts ?? 0) + 1 })
      .eq("id", active.id);
    return { ok: false, reason: "invalid" };
  }

  const consumedAt = new Date().toISOString();
  const { data: consumed, error } = await adminTable()
    .update({
      consumed_at: consumedAt,
      verified_at: consumedAt,
    })
    .eq("id", active.id)
    .is("consumed_at", null)
    .select("id, user_id")
    .maybeSingle();

  if (error) {
    throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
  }

  if (!consumed) {
    return { ok: false, reason: "already_used" };
  }

  return {
    ok: true,
    id: consumed.id as string,
    userId: consumed.user_id as string,
  };
}

export async function findPinResetGrant(email: string): Promise<EmailVerificationRow | null> {
  const normalized = normalizeEmail(email);
  const { data, error } = await adminTable()
    .select("*")
    .eq("email", normalized)
    .eq("purpose", EMAIL_OTP_PURPOSE.pinReset)
    .not("consumed_at", "is", null)
    .order("consumed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
  }

  const row = (data as EmailVerificationRow | null) ?? null;
  if (!row?.consumed_at) return null;
  const consumedAt = new Date(row.consumed_at).getTime();
  if (Date.now() - consumedAt > EMAIL_OTP_TTL_MS) return null;
  return row;
}

export async function deleteEmailOtp(id: string): Promise<void> {
  await adminTable().delete().eq("id", id);
}
