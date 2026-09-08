import "server-only";

import { prisma } from "@/lib/prisma/client";
import {
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_USER_MESSAGES,
  type EmailOtpPurpose,
} from "@/lib/auth/email-otp-constants";
import {
  consumeEmailOtpWithStore,
  deleteEmailOtpWithStore,
  findMatchingConsumedEmailOtpWithStore,
  findPinResetGrantWithStore,
  issueEmailOtpWithStore,
  type ConsumeEmailOtpFailure,
  type ConsumeEmailOtpResult,
  type EmailOtpStore,
  type EmailVerificationRow,
} from "@/lib/auth/email-otp-engine";

export {
  EMAIL_OTP_MAX_ATTEMPTS,
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_TTL_MS,
  EMAIL_OTP_USER_MESSAGES,
  messageForOtpFailure,
  type EmailOtpPurpose,
} from "@/lib/auth/email-otp-constants";

export type {
  ConsumeEmailOtpFailure,
  ConsumeEmailOtpResult,
  EmailVerificationRow,
};

function toRow(record: {
  id: string;
  userId: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  verifiedAt: Date | null;
  consumedAt: Date | null;
  purpose: string;
  createdAt: Date;
}): EmailVerificationRow {
  return {
    id: record.id,
    user_id: record.userId,
    email: record.email,
    code_hash: record.codeHash,
    expires_at: record.expiresAt.toISOString(),
    attempts: record.attempts,
    verified_at: record.verifiedAt?.toISOString() ?? null,
    consumed_at: record.consumedAt?.toISOString() ?? null,
    purpose: record.purpose,
    created_at: record.createdAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}

const prismaEmailOtpStore: EmailOtpStore = {
  async invalidateActive(email, purpose) {
    await prisma.emailVerification.updateMany({
      where: { email, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  },

  async insertChallenge(params) {
    try {
      const created = await prisma.emailVerification.create({
        data: {
          userId: params.userId,
          email: params.email,
          purpose: params.purpose,
          codeHash: params.codeHash,
          expiresAt: params.expiresAt,
          attempts: 0,
        },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw Object.assign(new Error(EMAIL_OTP_USER_MESSAGES.generic), {
          code: "P2002",
          cause: error,
        });
      }
      throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
    }
  },

  async supersedeOtherActive(email, purpose, keepId) {
    await prisma.emailVerification.updateMany({
      where: {
        email,
        purpose,
        consumedAt: null,
        NOT: { id: keepId },
      },
      data: { consumedAt: new Date() },
    });
  },

  async loadLatest(email, purpose, unconsumedOnly) {
    const record = await prisma.emailVerification.findFirst({
      where: unconsumedOnly
        ? { email, purpose, consumedAt: null }
        : { email, purpose },
      orderBy: { createdAt: "desc" },
    });
    return record ? toRow(record) : null;
  },

  async listConsumed(email, purpose) {
    const rows = await prisma.emailVerification.findMany({
      where: { email, purpose, consumedAt: { not: null } },
      orderBy: { consumedAt: "desc" },
      take: 10,
    });
    return rows.map(toRow);
  },

  async incrementAttempts(id, attempts) {
    await prisma.emailVerification.update({
      where: { id },
      data: { attempts },
    });
  },

  async markConsumed(id, at, verified) {
    const updated = await prisma.emailVerification.updateMany({
      where: { id, consumedAt: null },
      data: {
        consumedAt: at,
        ...(verified ? { verifiedAt: at } : {}),
      },
    });
    if (updated.count !== 1) return null;
    const row = await prisma.emailVerification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
    return row ? { id: row.id, userId: row.userId } : null;
  },

  async findLatestConsumedPinReset(email) {
    const record = await prisma.emailVerification.findFirst({
      where: {
        email,
        purpose: EMAIL_OTP_PURPOSE.pinReset,
        consumedAt: { not: null },
      },
      orderBy: { consumedAt: "desc" },
    });
    return record ? toRow(record) : null;
  },

  async deleteById(id) {
    await prisma.emailVerification.delete({ where: { id } }).catch(() => undefined);
  },
};

export async function invalidateActiveEmailOtps(
  email: string,
  purpose: EmailOtpPurpose,
): Promise<void> {
  await prismaEmailOtpStore.invalidateActive(email, purpose);
}

export async function issueEmailOtp(params: {
  userId: string;
  email: string;
  purpose: EmailOtpPurpose;
}): Promise<string> {
  return issueEmailOtpWithStore(prismaEmailOtpStore, params);
}

export async function findMatchingConsumedEmailOtp(params: {
  email: string;
  code: string;
  purpose: EmailOtpPurpose;
}): Promise<EmailVerificationRow | null> {
  return findMatchingConsumedEmailOtpWithStore(prismaEmailOtpStore, params);
}

export async function consumeEmailOtp(params: {
  email: string;
  code: string;
  purpose: EmailOtpPurpose;
}): Promise<ConsumeEmailOtpResult> {
  return consumeEmailOtpWithStore(prismaEmailOtpStore, params);
}

export async function findPinResetGrant(
  email: string,
): Promise<EmailVerificationRow | null> {
  return findPinResetGrantWithStore(prismaEmailOtpStore, email);
}

export async function deleteEmailOtp(id: string): Promise<void> {
  await deleteEmailOtpWithStore(prismaEmailOtpStore, id);
}
