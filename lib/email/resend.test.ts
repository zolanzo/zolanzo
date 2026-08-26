import { afterEach, describe, expect, it } from "vitest";
import { isLiveEmailRequired, sendEmailOtp } from "@/lib/email/resend";

describe("isLiveEmailRequired", () => {
  it("requires live mail in production and staging", () => {
    expect(isLiveEmailRequired({ NODE_ENV: "production" })).toBe(true);
    expect(isLiveEmailRequired({ ZOLANZO_ENV: "production" })).toBe(true);
    expect(isLiveEmailRequired({ ZOLANZO_ENV: "staging" })).toBe(true);
    expect(isLiveEmailRequired({ NODE_ENV: "development" })).toBe(false);
  });
});

describe("sendEmailOtp", () => {
  const previousZolanzoEnv = process.env.ZOLANZO_ENV;
  const previousKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (previousZolanzoEnv === undefined) delete process.env.ZOLANZO_ENV;
    else process.env.ZOLANZO_ENV = previousZolanzoEnv;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
  });

  it("fails closed in production without an API key", async () => {
    delete process.env.RESEND_API_KEY;
    process.env.ZOLANZO_ENV = "production";
    const result = await sendEmailOtp("ada@example.com", "123456", "Ada");
    expect(result.success).toBe(false);
  });

  it("stubs in development without an API key", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.ZOLANZO_ENV;
    const result = await sendEmailOtp("ada@example.com", "123456", "Ada");
    expect(result.success).toBe(true);
  });
});
