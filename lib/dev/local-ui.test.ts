import { describe, expect, it } from "vitest";
import { isLocalUiPreview } from "@/lib/dev/local-ui";

describe("isLocalUiPreview", () => {
  it("is true only in development", () => {
    expect(isLocalUiPreview("development")).toBe(true);
    expect(isLocalUiPreview("production")).toBe(false);
    expect(isLocalUiPreview("test")).toBe(false);
    expect(isLocalUiPreview(undefined)).toBe(false);
  });
});
