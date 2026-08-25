import { describe, expect, it } from "vitest";
import { withKeyedLock } from "@/lib/auth/keyed-lock";

describe("withKeyedLock", () => {
  it("runs work for the same key in order", async () => {
    const order: number[] = [];
    await Promise.all([
      withKeyedLock("otp:same", async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        order.push(1);
      }),
      withKeyedLock("otp:same", async () => {
        order.push(2);
      }),
    ]);
    expect(order).toEqual([1, 2]);
  });

  it("does not block different keys", async () => {
    const started: string[] = [];
    await Promise.all([
      withKeyedLock("a", async () => {
        started.push("a");
        await new Promise((resolve) => setTimeout(resolve, 30));
      }),
      withKeyedLock("b", async () => {
        started.push("b");
      }),
    ]);
    expect(started).toContain("a");
    expect(started).toContain("b");
  });
});
