import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = new Map<string, string>();
const findUnique = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();
const createOtp = vi.fn();
const confirmOtp = vi.fn();
const rateLimitMock = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string) => {
      if (!value) cookieStore.delete(name);
      else cookieStore.set(name, value);
    },
  }),
}));

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock("@/lib/integrations/notifications/sendchamp/otp", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/integrations/notifications/sendchamp/otp")
  >("@/lib/integrations/notifications/sendchamp/otp");
  return {
    ...actual,
    createSendchampOtp: (...args: unknown[]) => createOtp(...args),
    confirmSendchampOtp: (...args: unknown[]) => confirmOtp(...args),
  };
});

vi.mock("@/lib/security/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/security/rate-limit")>(
    "@/lib/security/rate-limit",
  );
  return {
    ...actual,
    rateLimit: (...args: unknown[]) => rateLimitMock(...args),
  };
});

vi.mock("@/lib/audit/write", () => ({
  writeAuditLog: vi.fn(async () => undefined),
}));

vi.mock("@/lib/validation/env", async () => {
  const actual = await vi.importActual<typeof import("@/lib/validation/env")>(
    "@/lib/validation/env",
  );
  return {
    ...actual,
    isServiceRoleConfigured: () => false,
  };
});

import { AppError } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/session";
import {
  confirmPhoneOtp,
  requestPhoneOtp,
} from "@/features/authentication/services/phone-verification";

const ctx = {
  supabaseUserId: "auth-sub-1",
  user: { id: "user_1" },
} as AuthContext;

describe("phone verification service", () => {
  beforeEach(() => {
    cookieStore.clear();
    findUnique.mockReset();
    findFirst.mockReset();
    update.mockReset();
    createOtp.mockReset();
    confirmOtp.mockReset();
    rateLimitMock.mockReset();
    process.env.CSRF_SECRET = "csrf-secret-value-that-is-long-enough";
    rateLimitMock.mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 1000,
      resetSeconds: 1,
    });
  });

  it("does not send when the number is already verified", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: "2348012345678",
      phoneVerifiedAt: new Date(),
      profile: { displayName: "Ada" },
    });
    const result = await requestPhoneOtp({
      ctx,
      phone: "08012345678",
    });
    expect(result).toEqual({ alreadyVerified: true });
    expect(createOtp).not.toHaveBeenCalled();
  });

  it("requests OTP and keeps the reference out of the return value", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: { displayName: "Ada" },
    });
    createOtp.mockResolvedValue({ ok: true, reference: "MN-OTP-hidden" });
    const result = await requestPhoneOtp({
      ctx,
      phone: "08012345678",
      ip: "127.0.0.1",
    });
    expect(result).toEqual({ sent: true });
    expect(JSON.stringify(result)).not.toContain("MN-OTP-hidden");
    expect(createOtp).toHaveBeenCalledWith(
      expect.objectContaining({ mobileNumber: "2348012345678" }),
    );
    expect(cookieStore.get("zolanzo_phone_otp")).toBeTruthy();
  });

  it("returns a controlled error when Sendchamp create fails", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: null,
    });
    createOtp.mockResolvedValue({ ok: false, status: 500, code: "rejected" });
    await expect(
      requestPhoneOtp({ ctx, phone: "08012345678" }),
    ).rejects.toMatchObject({
      message: "Unable to send verification code. Please try again.",
    });
  });

  it("confirms OTP and sets phoneVerifiedAt only after Sendchamp success", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: { displayName: "Ada" },
    });
    createOtp.mockResolvedValue({ ok: true, reference: "MN-OTP-hidden" });
    await requestPhoneOtp({ ctx, phone: "08012345678" });
    findFirst.mockResolvedValue(null);
    confirmOtp.mockResolvedValue({ ok: true });
    update.mockResolvedValue({});

    const result = await confirmPhoneOtp({
      ctx,
      phone: "08012345678",
      code: "123456",
    });
    expect(result).toEqual({ verified: true });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({
          phone: "2348012345678",
        }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain("MN-OTP-hidden");
  });

  it("does not mark verified on invalid OTP", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: null,
    });
    createOtp.mockResolvedValue({ ok: true, reference: "MN-OTP-hidden" });
    await requestPhoneOtp({ ctx, phone: "08012345678" });
    findFirst.mockResolvedValue(null);
    confirmOtp.mockResolvedValue({ ok: false, status: 400, code: "invalid" });

    await expect(
      confirmPhoneOtp({ ctx, phone: "08012345678", code: "000000" }),
    ).rejects.toMatchObject({
      message: "Incorrect verification code.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not mark verified on expired OTP", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: null,
    });
    createOtp.mockResolvedValue({ ok: true, reference: "MN-OTP-hidden" });
    await requestPhoneOtp({ ctx, phone: "08012345678" });
    findFirst.mockResolvedValue(null);
    confirmOtp.mockResolvedValue({ ok: false, status: 400, code: "expired" });

    await expect(
      confirmPhoneOtp({ ctx, phone: "08012345678", code: "123456" }),
    ).rejects.toMatchObject({
      message: "Verification code expired. Request a new one.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rate-limits resend", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: null,
    });
    rateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now(),
      resetSeconds: 30,
    });
    await expect(
      requestPhoneOtp({ ctx, phone: "08012345678" }),
    ).rejects.toBeInstanceOf(AppError);
    expect(createOtp).not.toHaveBeenCalled();
  });

  it("rejects a phone already verified on another account", async () => {
    findUnique.mockResolvedValue({
      id: "user_1",
      phone: null,
      phoneVerifiedAt: null,
      profile: null,
    });
    createOtp.mockResolvedValue({ ok: true, reference: "MN-OTP-hidden" });
    await requestPhoneOtp({ ctx, phone: "08012345678" });
    findFirst.mockResolvedValue({ id: "user_other" });

    await expect(
      confirmPhoneOtp({ ctx, phone: "08012345678", code: "123456" }),
    ).rejects.toMatchObject({
      message: "Unable to send verification code. Please try again.",
    });
    expect(confirmOtp).not.toHaveBeenCalled();
  });
});
