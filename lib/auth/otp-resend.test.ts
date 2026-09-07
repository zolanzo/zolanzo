import { describe, expect, it } from "vitest";
import { hasEmailVerificationContext } from "@/lib/auth/otp-resend";

describe("hasEmailVerificationContext", () => {
  it("is false without an email", () => {
    expect(hasEmailVerificationContext(undefined)).toBe(false);
    expect(hasEmailVerificationContext(null)).toBe(false);
    expect(hasEmailVerificationContext("")).toBe(false);
    expect(hasEmailVerificationContext("   ")).toBe(false);
  });

  it("is true when an email is present", () => {
    expect(hasEmailVerificationContext("user@example.com")).toBe(true);
  });
});
