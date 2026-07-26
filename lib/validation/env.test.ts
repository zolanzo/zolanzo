import { describe, expect, it, beforeEach } from "vitest";
import {
  loadEnv,
  resetEnvCache,
  isSupabaseConfigured,
} from "@/lib/validation/env";

describe("loadEnv", () => {
  beforeEach(() => {
    resetEnvCache();
  });

  it("loads development env with app URL default", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      ZOLANZO_ENV: "development",
    });

    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(env.ZOLANZO_ENV).toBe("development");
  });

  it("fails fast in production when required secrets are missing", () => {
    expect(() =>
      loadEnv({
        NODE_ENV: "production",
        ZOLANZO_ENV: "production",
        NEXT_PUBLIC_APP_URL: "https://zolanzo.com",
      }),
    ).toThrow(/Missing required environment variables/);
  });

  it("accepts optional ecosystem variables without connecting", () => {
    const env = loadEnv({
      NODE_ENV: "development",
      ZOLANZO_ENV: "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      STANKINGS_PASSPORT_URL: "https://passport.example.com",
      STANKINGS_PASSPORT_KEY: "test-key",
      SENDCHAMP_API_KEY: "sms-key",
      SENDCHAMP_SENDER_ID: "ZOLANZO",
    });

    expect(env.STANKINGS_PASSPORT_URL).toBe("https://passport.example.com");
    expect(env.SENDCHAMP_SENDER_ID).toBe("ZOLANZO");
    expect(isSupabaseConfigured(env)).toBe(false);
  });
});
