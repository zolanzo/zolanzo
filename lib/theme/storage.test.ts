import { describe, expect, it } from "vitest";
import { parseThemeMode } from "@/lib/theme/storage";

describe("theme preference parsing", () => {
  it("keeps valid Light and Dark values", () => {
    expect(parseThemeMode("light")).toBe("light");
    expect(parseThemeMode("dark")).toBe("dark");
  });

  it("ignores Auto, System, and unknown values so the schedule can apply", () => {
    expect(parseThemeMode("auto")).toBeNull();
    expect(parseThemeMode("system")).toBeNull();
    expect(parseThemeMode(null)).toBeNull();
    expect(parseThemeMode(undefined)).toBeNull();
    expect(parseThemeMode("")).toBeNull();
  });
});
