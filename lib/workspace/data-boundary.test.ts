import { describe, expect, it } from "vitest";
import { marketplaceEmptyCopy } from "@/lib/workspace/data-boundary";

describe("marketplaceEmptyCopy", () => {
  it("keeps live empty inventory honest", () => {
    const copy = marketplaceEmptyCopy({ kind: "live" });
    expect(copy.title).toBe("No tasks yet");
    expect(copy.actionHref).toBeUndefined();
  });

  it("points unsigned visitors to login instead of a fake outage", () => {
    const copy = marketplaceEmptyCopy({ kind: "unauthenticated" });
    expect(copy.title).toBe("Sign in to find work");
    expect(copy.actionHref).toBe("/login?next=/tasks");
  });
});
