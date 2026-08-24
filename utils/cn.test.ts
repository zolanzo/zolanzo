import { describe, expect, it } from "vitest";
import { cn } from "@/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("flex", false, "items-center", null, undefined)).toBe(
      "flex items-center",
    );
  });

  it("lets later height utilities win so theme logos honor caller size", () => {
    const merged = cn("h-auto w-auto object-contain", "h-[32px] w-auto");
    expect(merged).toContain("h-[32px]");
    expect(merged).toContain("w-auto");
    expect(merged).toContain("object-contain");
    expect(merged).not.toContain("h-auto");
  });

  it("lets later semantic color utilities replace hardcoded ones", () => {
    const merged = cn("bg-white text-zinc-900", "bg-background text-foreground");
    expect(merged).toContain("bg-background");
    expect(merged).toContain("text-foreground");
    expect(merged).not.toContain("bg-white");
    expect(merged).not.toContain("text-zinc-900");
  });
});
