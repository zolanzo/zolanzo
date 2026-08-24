import { afterEach, describe, expect, it } from "vitest";
import {
  createPhoneOtpChallenge,
  decodePhoneOtpChallenge,
  encodePhoneOtpChallenge,
  phoneOtpChallengeExpired,
  phoneOtpCookieOptions,
  PHONE_OTP_COOKIE,
  PHONE_OTP_MAX_ATTEMPTS,
} from "@/lib/auth/phone-otp-challenge";
import { SENDCHAMP_OTP_EXPIRATION_MINUTES } from "@/lib/integrations/notifications/sendchamp/otp";

describe("phone OTP challenge cookie", () => {
  afterEach(() => {
    delete process.env.CSRF_SECRET;
  });

  it("is named for httpOnly server use", () => {
    expect(PHONE_OTP_COOKIE).toBe("zolanzo_phone_otp");
    expect(PHONE_OTP_MAX_ATTEMPTS).toBe(5);
  });

  it("round-trips a signed challenge", () => {
    process.env.CSRF_SECRET = "csrf-secret-value-that-is-long-enough";
    const challenge = createPhoneOtpChallenge({
      userId: "user_1",
      phone: "2348012345678",
      reference: "MN-OTP-abc",
      nowMs: 1_000,
    });
    const token = encodePhoneOtpChallenge(challenge);
    expect(token).toBeTruthy();
    expect(decodePhoneOtpChallenge(token)).toEqual(challenge);
  });

  it("rejects a tampered token", () => {
    process.env.CSRF_SECRET = "csrf-secret-value-that-is-long-enough";
    const challenge = createPhoneOtpChallenge({
      userId: "user_1",
      phone: "2348012345678",
      reference: "MN-OTP-abc",
    });
    const token = encodePhoneOtpChallenge(challenge)!;
    expect(decodePhoneOtpChallenge(`${token}tamper`)).toBeNull();
  });

  it("remains valid for 20 minutes and expires after that window", () => {
    expect(SENDCHAMP_OTP_EXPIRATION_MINUTES).toBe(20);
    const windowMs = 20 * 60 * 1000;
    const challenge = createPhoneOtpChallenge({
      userId: "user_1",
      phone: "2348012345678",
      reference: "MN-OTP-abc",
      nowMs: 0,
    });
    expect(phoneOtpChallengeExpired(challenge, windowMs - 1)).toBe(false);
    expect(phoneOtpChallengeExpired(challenge, windowMs)).toBe(true);
    expect(phoneOtpCookieOptions().maxAge).toBe(20 * 60);
  });
});
