import { describe, expect, it } from "vitest";
import { randomUUID } from "crypto";
import { hashOtpCode } from "@/lib/otp/generator";
import {
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_TTL_MS,
} from "@/lib/auth/email-otp-constants";
import {
  consumeEmailOtpWithStore,
  findPinResetGrantWithStore,
  issueEmailOtpWithStore,
  type EmailOtpClock,
  type EmailOtpStore,
  type EmailVerificationRow,
} from "@/lib/auth/email-otp-engine";

class MemoryEmailOtpStore implements EmailOtpStore {
  rows: EmailVerificationRow[] = [];

  async invalidateActive(email: string, purpose: string) {
    const now = new Date().toISOString();
    for (const row of this.rows) {
      if (row.email === email && row.purpose === purpose && !row.consumed_at) {
        row.consumed_at = now;
      }
    }
  }

  async insertChallenge(params: {
    userId: string;
    email: string;
    purpose: string;
    codeHash: string;
    expiresAt: Date;
  }) {
    const id = randomUUID();
    const created = new Date().toISOString();
    this.rows.push({
      id,
      user_id: params.userId,
      email: params.email,
      code_hash: params.codeHash,
      expires_at: params.expiresAt.toISOString(),
      attempts: 0,
      verified_at: null,
      consumed_at: null,
      purpose: params.purpose,
      created_at: created,
    });
    return id;
  }

  async supersedeOtherActive(email: string, purpose: string, keepId: string) {
    const now = new Date().toISOString();
    for (const row of this.rows) {
      if (
        row.email === email &&
        row.purpose === purpose &&
        !row.consumed_at &&
        row.id !== keepId
      ) {
        row.consumed_at = now;
      }
    }
  }

  async loadLatest(email: string, purpose: string, unconsumedOnly: boolean) {
    return (
      this.rows
        .filter(
          (row) =>
            row.email === email &&
            row.purpose === purpose &&
            (!unconsumedOnly || !row.consumed_at),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    );
  }

  async listConsumed(email: string, purpose: string) {
    return this.rows
      .filter(
        (row) =>
          row.email === email && row.purpose === purpose && Boolean(row.consumed_at),
      )
      .sort((a, b) => (b.consumed_at ?? "").localeCompare(a.consumed_at ?? ""));
  }

  async incrementAttempts(id: string, attempts: number) {
    const row = this.rows.find((item) => item.id === id);
    if (row) row.attempts = attempts;
  }

  async markConsumed(id: string, at: Date, verified: boolean) {
    const row = this.rows.find((item) => item.id === id);
    if (!row || row.consumed_at) return null;
    row.consumed_at = at.toISOString();
    if (verified) row.verified_at = at.toISOString();
    return { id: row.id, userId: row.user_id };
  }

  async findLatestConsumedPinReset(email: string) {
    return (
      this.rows
        .filter(
          (row) =>
            row.email === email &&
            row.purpose === EMAIL_OTP_PURPOSE.pinReset &&
            Boolean(row.consumed_at),
        )
        .sort((a, b) => (b.consumed_at ?? "").localeCompare(a.consumed_at ?? ""))[0] ??
      null
    );
  }

  async deleteById(id: string) {
    this.rows = this.rows.filter((row) => row.id !== id);
  }
}

function clockAt(ms: number): EmailOtpClock {
  return { now: () => new Date(ms) };
}

describe("email OTP engine", () => {
  const userId = randomUUID();
  const email = "ada@zolanzo.test";

  it("stores the hash of the same OTP that is returned for sending", async () => {
    const store = new MemoryEmailOtpStore();
    const otp = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(otp).toMatch(/^\d{6}$/);
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]?.code_hash).toBe(hashOtpCode(otp));
    expect(store.rows[0]?.purpose).toBe(EMAIL_OTP_PURPOSE.emailVerification);
    expect(store.rows[0]?.consumed_at).toBeNull();
  });

  it("consumes the current verification OTP and rejects replay", async () => {
    const store = new MemoryEmailOtpStore();
    const otp = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    const first = await consumeEmailOtpWithStore(store, {
      email,
      code: otp,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(first).toEqual({ ok: true, id: store.rows[0]?.id, userId });
    const replay = await consumeEmailOtpWithStore(store, {
      email,
      code: otp,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(replay).toEqual({ ok: false, reason: "already_used" });
  });

  it("isolates email verification from PIN reset purposes", async () => {
    const store = new MemoryEmailOtpStore();
    const verifyOtp = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    const resetOtp = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.pinReset,
    });
    expect(verifyOtp).not.toBe(resetOtp);

    const wrongPurpose = await consumeEmailOtpWithStore(store, {
      email,
      code: resetOtp,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(wrongPurpose).toEqual({ ok: false, reason: "invalid" });

    const verifyOk = await consumeEmailOtpWithStore(store, {
      email,
      code: verifyOtp,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(verifyOk.ok).toBe(true);

    const resetWithVerifyCode = await consumeEmailOtpWithStore(store, {
      email,
      code: verifyOtp,
      purpose: EMAIL_OTP_PURPOSE.pinReset,
    });
    expect(resetWithVerifyCode).toEqual({ ok: false, reason: "invalid" });

    const resetOk = await consumeEmailOtpWithStore(store, {
      email,
      code: resetOtp,
      purpose: EMAIL_OTP_PURPOSE.pinReset,
    });
    expect(resetOk.ok).toBe(true);
  });

  it("invalidates the previous OTP after resend", async () => {
    const store = new MemoryEmailOtpStore();
    const first = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    const second = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(second).not.toBe(first);
    const old = await consumeEmailOtpWithStore(store, {
      email,
      code: first,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(old).toEqual({ ok: false, reason: "already_used" });
    const current = await consumeEmailOtpWithStore(store, {
      email,
      code: second,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(current.ok).toBe(true);
  });

  it("rejects expired OTPs without consuming a later valid flow", async () => {
    const store = new MemoryEmailOtpStore();
    const start = Date.now();
    const otp = await issueEmailOtpWithStore(
      store,
      { userId, email, purpose: EMAIL_OTP_PURPOSE.emailVerification },
      clockAt(start),
    );
    const expired = await consumeEmailOtpWithStore(
      store,
      { email, code: otp, purpose: EMAIL_OTP_PURPOSE.emailVerification },
      clockAt(start + EMAIL_OTP_TTL_MS + 1),
    );
    expect(expired).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects a PIN-reset grant after the consumed-code window", async () => {
    const store = new MemoryEmailOtpStore();
    const start = Date.now();
    const otp = await issueEmailOtpWithStore(
      store,
      { userId, email, purpose: EMAIL_OTP_PURPOSE.pinReset },
      clockAt(start),
    );
    const consumed = await consumeEmailOtpWithStore(
      store,
      { email, code: otp, purpose: EMAIL_OTP_PURPOSE.pinReset },
      clockAt(start + 1_000),
    );
    expect(consumed.ok).toBe(true);
    const grant = await findPinResetGrantWithStore(
      store,
      email,
      clockAt(start + EMAIL_OTP_TTL_MS + 2_000),
    );
    expect(grant).toBeNull();
  });

  it("rejects the wrong email even with the correct code", async () => {
    const store = new MemoryEmailOtpStore();
    const otp = await issueEmailOtpWithStore(store, {
      userId,
      email,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    const result = await consumeEmailOtpWithStore(store, {
      email: "other@zolanzo.test",
      code: otp,
      purpose: EMAIL_OTP_PURPOSE.emailVerification,
    });
    expect(result).toEqual({ ok: false, reason: "no_active" });
  });
});
