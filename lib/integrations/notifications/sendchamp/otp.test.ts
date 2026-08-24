import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isNormalizedMsisdn,
  normalizeSendchampMsisdn,
} from "@/lib/integrations/notifications/sendchamp/msisdn";
import {
  getSendchampApiBaseUrl,
  SENDCHAMP_API_BASE,
} from "@/lib/integrations/notifications/sendchamp/client";
import {
  confirmSendchampOtp,
  createSendchampOtp,
  createSendchampOtpConfirmBody,
  createSendchampOtpRequestBody,
  PHONE_VERIFICATION_SMS_COPY,
  probeSendchampApi,
  renderPhoneVerificationSmsCopy,
  SENDCHAMP_OTP_EXPIRATION_MINUTES,
  SENDCHAMP_OTP_LENGTH,
} from "@/lib/integrations/notifications/sendchamp/otp";
import { sendchampCircuit } from "@/lib/integrations/notifications/sendchamp/circuit";
import { redactFields } from "@/lib/observability/redact";

describe("Sendchamp MSISDN normalization", () => {
  it("converts Nigerian 080 numbers to 234", () => {
    expect(normalizeSendchampMsisdn("08012345678")).toBe("2348012345678");
  });

  it("converts 10-digit national numbers", () => {
    expect(normalizeSendchampMsisdn("8012345678")).toBe("2348012345678");
  });

  it("strips plus and leaves international 234", () => {
    expect(normalizeSendchampMsisdn("+2348012345678")).toBe("2348012345678");
  });

  it("repairs +234 combined with a leading 0", () => {
    expect(normalizeSendchampMsisdn("+23408012345678")).toBe("2348012345678");
  });

  it("accepts a complete Nigerian MSISDN", () => {
    expect(isNormalizedMsisdn("08012345678")).toBe(true);
    expect(isNormalizedMsisdn("123")).toBe(false);
  });
});

describe("Sendchamp base URL", () => {
  afterEach(() => {
    delete process.env.SENDCHAMP_API_BASE_URL;
  });

  it("defaults to the live API base", () => {
    delete process.env.SENDCHAMP_API_BASE_URL;
    expect(getSendchampApiBaseUrl()).toBe(SENDCHAMP_API_BASE);
    expect(SENDCHAMP_API_BASE).toBe("https://api.sendchamp.com/api/v1");
  });

  it("uses SENDCHAMP_API_BASE_URL when set", () => {
    process.env.SENDCHAMP_API_BASE_URL = "https://api.sendchamp.com/api/v1/";
    expect(getSendchampApiBaseUrl()).toBe("https://api.sendchamp.com/api/v1");
  });
});

describe("Sendchamp OTP request bodies", () => {
  it("builds the official create payload with 20-minute expiry and 6-digit numeric token", () => {
    process.env.SENDCHAMP_SENDER_ID = "AcmeSender";
    expect(SENDCHAMP_OTP_LENGTH).toBe(6);
    expect(SENDCHAMP_OTP_EXPIRATION_MINUTES).toBe(20);
    const body = createSendchampOtpRequestBody({
      mobileNumber: "08012345678",
      firstName: "Ada",
    });
    expect(body).toEqual({
      channel: "sms",
      sender: "AcmeSender",
      token_type: "numeric",
      token_length: 6,
      expiration_time: 20,
      customer_mobile_number: "2348012345678",
      meta_data: { first_name: "Ada" },
    });
    expect(body).not.toHaveProperty("message");
    expect(body).not.toHaveProperty("sms");
    expect(body).not.toHaveProperty("content");
    expect(body).not.toHaveProperty("template");
  });

  it("keeps Zolanzo-controlled SMS copy at 20 minutes without inventing a Sendchamp body field", () => {
    expect(PHONE_VERIFICATION_SMS_COPY).toBe(
      "ZOLANZO: Your verification code is {{OTP}}. It expires in 20 minutes. Do not share this code with anyone.",
    );
    expect(renderPhoneVerificationSmsCopy("365568")).toBe(
      "ZOLANZO: Your verification code is 365568. It expires in 20 minutes. Do not share this code with anyone.",
    );
  });

  it("builds the official confirm payload", () => {
    expect(
      createSendchampOtpConfirmBody({
        verificationReference: "MN-OTP-ref",
        verificationCode: "123456",
      }),
    ).toEqual({
      verification_reference: "MN-OTP-ref",
      verification_code: "123456",
    });
  });
});

describe("Sendchamp OTP HTTP", () => {
  afterEach(() => {
    delete process.env.SENDCHAMP_API_KEY;
    sendchampCircuit.reset();
  });

  it("fails closed when the API key is missing", async () => {
    delete process.env.SENDCHAMP_API_KEY;
    const created = await createSendchampOtp({ mobileNumber: "2348012345678" });
    expect(created).toEqual({ ok: false, status: 0, code: "not_configured" });
  });

  it("stores only the verification reference from a successful create", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const created = await createSendchampOtp({
      mobileNumber: "08012345678",
      fetchImpl: (async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({
            status: "success",
            code: 200,
            data: {
              reference: "MN-OTP-abc",
              token: "482913",
              business_uid: "should-not-leak",
              status: "sent",
            },
          }),
        })) as unknown as typeof fetch,
    });
    expect(created).toEqual({ ok: true, reference: "MN-OTP-abc" });
    expect(JSON.stringify(created)).not.toContain("482913");
    expect(JSON.stringify(created)).not.toContain("should-not-leak");
  });

  it("maps create failures without exposing provider text to the result code", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const created = await createSendchampOtp({
      mobileNumber: "2348012345678",
      fetchImpl: (async () =>
        ({
          ok: false,
          status: 403,
          json: async () => ({
            status: "error",
            message: "insufficient funds",
          }),
        })) as unknown as typeof fetch,
    });
    expect(created.ok).toBe(false);
    if (!created.ok) expect(created.code).toBe("rejected");
  });

  it("confirms with verification_reference and verification_code", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
      expect(body.verification_reference).toBe("MN-OTP-abc");
      expect(body.verification_code).toBe("123456");
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: "success", code: 200, data: { status: "confirmed" } }),
      };
    });
    const confirmed = await confirmSendchampOtp({
      verificationReference: "MN-OTP-abc",
      verificationCode: "123456",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(confirmed).toEqual({ ok: true });
  });

  it("maps invalid OTP", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const confirmed = await confirmSendchampOtp({
      verificationReference: "MN-OTP-abc",
      verificationCode: "000000",
      fetchImpl: (async () =>
        ({
          ok: false,
          status: 400,
          json: async () => ({
            status: "failed",
            message: "invalid token",
          }),
        })) as unknown as typeof fetch,
    });
    expect(confirmed).toEqual({ ok: false, status: 400, code: "invalid" });
  });

  it("maps expired OTP", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const confirmed = await confirmSendchampOtp({
      verificationReference: "MN-OTP-abc",
      verificationCode: "123456",
      fetchImpl: (async () =>
        ({
          ok: false,
          status: 400,
          json: async () => ({
            status: "failed",
            message: "token expired",
          }),
        })) as unknown as typeof fetch,
    });
    expect(confirmed).toEqual({ ok: false, status: 400, code: "expired" });
  });

  it("probes wallet balance without sending SMS", async () => {
    process.env.SENDCHAMP_API_KEY = "sc_test";
    const fetchImpl = vi.fn(async (url: string) => {
      expect(String(url)).toContain("/wallet/wallet_balance");
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: "success", code: "200", data: { available_balance: "1" } }),
      };
    });
    const probe = await probeSendchampApi({
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(probe.ok).toBe(true);
    expect(JSON.stringify(probe)).not.toContain("available_balance");
  });
});

describe("secret redaction", () => {
  it("redacts verification_reference and verification_code", () => {
    const redacted = redactFields({
      verification_reference: "MN-OTP-secret",
      verification_code: "123456",
      SENDCHAMP_API_KEY: "sc_live_secret",
    });
    expect(redacted?.verification_reference).toBe("[REDACTED]");
    expect(redacted?.verification_code).toBe("[REDACTED]");
    expect(redacted?.SENDCHAMP_API_KEY).toBe("[REDACTED]");
  });
});
