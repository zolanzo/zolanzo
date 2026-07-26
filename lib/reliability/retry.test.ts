import { describe, expect, it } from "vitest";
import {
  computeRetryDelayMs,
  isRetryExhausted,
  resolveRetryPolicy,
  withRetry,
} from "@/lib/reliability/retry";

describe("retry policies", () => {
  it("resolves named policies", () => {
    expect(resolveRetryPolicy("immediate").strategy).toBe("immediate");
    expect(resolveRetryPolicy("exponential").maxAttempts).toBe(5);
    expect(resolveRetryPolicy("finance").deadLetterReady).toBe(true);
  });

  it("immediate delay is zero", () => {
    expect(computeRetryDelayMs(resolveRetryPolicy("immediate"), 1)).toBe(0);
  });

  it("exponential grows then caps", () => {
    const policy = {
      ...resolveRetryPolicy("exponential"),
      jitter: false,
      baseDelayMs: 100,
      maxDelayMs: 400,
    };
    expect(computeRetryDelayMs(policy, 1)).toBe(100);
    expect(computeRetryDelayMs(policy, 2)).toBe(200);
    expect(computeRetryDelayMs(policy, 3)).toBe(400);
    expect(computeRetryDelayMs(policy, 4)).toBe(400);
  });

  it("isRetryExhausted respects maxAttempts", () => {
    const policy = resolveRetryPolicy("immediate");
    expect(isRetryExhausted(policy, 2)).toBe(false);
    expect(isRetryExhausted(policy, 3)).toBe(true);
  });

  it("withRetry succeeds after transient failures", async () => {
    let n = 0;
    const outcome = await withRetry(
      {
        maxAttempts: 3,
        strategy: "immediate",
        baseDelayMs: 0,
        maxDelayMs: 0,
        jitter: false,
        deadLetterReady: true,
      },
      async () => {
        n += 1;
        if (n < 3) throw new Error("transient");
        return "ok";
      },
      { sleep: async () => undefined },
    );
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.value).toBe("ok");
      expect(outcome.attempts).toBe(3);
    }
  });

  it("withRetry marks dead-letter when exhausted", async () => {
    const outcome = await withRetry(
      "immediate",
      async () => {
        throw new Error("boom");
      },
      { sleep: async () => undefined },
    );
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.deadLetterReady).toBe(true);
      expect(outcome.attempts).toBe(3);
    }
  });
});
