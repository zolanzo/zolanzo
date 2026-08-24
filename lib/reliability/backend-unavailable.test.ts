import { describe, expect, it } from "vitest";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";

describe("isBackendUnavailableError", () => {
  it("detects paused or unreachable backends", () => {
    expect(isBackendUnavailableError(new Error("getaddrinfo ENOTFOUND example.supabase.co"))).toBe(
      true,
    );
    expect(
      isBackendUnavailableError(new Error("FATAL: (ENOTFOUND) tenant/user postgres.abc not found")),
    ).toBe(true);
    expect(isBackendUnavailableError(new Error("Can't reach database server"))).toBe(true);
    expect(isBackendUnavailableError(new Error("fetch failed"))).toBe(true);
    expect(isBackendUnavailableError({ message: "fetch failed" })).toBe(true);
  });

  it("does not treat application errors as outages", () => {
    expect(isBackendUnavailableError(new Error("Invalid credentials"))).toBe(false);
    expect(isBackendUnavailableError(new Error("UNAUTHENTICATED"))).toBe(false);
  });
});
