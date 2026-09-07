import { beforeEach, describe, expect, it } from "vitest";
import {
  CONTACT_MATH_MAX,
  CONTACT_MATH_MIN,
  consumeMathNonce,
  createMathChallenge,
  decodeMathChallenge,
  expectedMathSum,
  resetMathNonceStoreForTests,
  resolveContactChallengeSecret,
  verifyMathAnswer,
} from "@/lib/contact/math-challenge";
import { parseMathAnswer } from "@/lib/contact/math";

const SECRET = "contact-test-secret";

describe("contact maths challenge", () => {
  beforeEach(() => {
    resetMathNonceStoreForTests();
  });

  it("generates 1–9 addition prompts without exposing the answer in the token", () => {
    for (let i = 0; i < 40; i += 1) {
      const challenge = createMathChallenge({ secret: SECRET });
      expect(challenge).not.toBeNull();
      if (!challenge) continue;
      expect(challenge.left).toBeGreaterThanOrEqual(CONTACT_MATH_MIN);
      expect(challenge.left).toBeLessThanOrEqual(CONTACT_MATH_MAX);
      expect(challenge.right).toBeGreaterThanOrEqual(CONTACT_MATH_MIN);
      expect(challenge.right).toBeLessThanOrEqual(CONTACT_MATH_MAX);
      expect(challenge.prompt).toBe(`What is ${challenge.left} + ${challenge.right}?`);
      expect(challenge.prompt).not.toMatch(/-/);
      expect(challenge.token.toLowerCase()).not.toContain("answer");
      const payload = decodeMathChallenge(challenge.token, SECRET);
      expect(payload).not.toBeNull();
      expect(JSON.stringify(payload)).not.toContain("answer");
      expect(JSON.stringify(payload)).not.toContain("sum");
      expect(payload!.l).toBe(challenge.left);
      expect(payload!.r).toBe(challenge.right);
      expect(expectedMathSum(payload!.l, payload!.r)).toBe(challenge.left + challenge.right);
    }
  });

  it("accepts the correct sum and rejects an incorrect answer", () => {
    const challenge = createMathChallenge({
      secret: SECRET,
      left: 4,
      right: 7,
      nonce: "nonce-correct-math",
    });
    expect(challenge).not.toBeNull();
    const token = challenge!.token;
    expect(verifyMathAnswer({ token, answer: "11", secret: SECRET }).ok).toBe(true);
    expect(verifyMathAnswer({ token, answer: "10", secret: SECRET }).ok).toBe(false);
    expect(verifyMathAnswer({ token, answer: "4", secret: SECRET }).ok).toBe(false);
    expect(parseMathAnswer("11")).toBe(11);
  });

  it("rejects an expired or forged token", () => {
    const now = 1_700_000_000_000;
    const challenge = createMathChallenge({
      secret: SECRET,
      left: 2,
      right: 2,
      nowMs: now,
      ttlMs: 1000,
      nonce: "nonce-expired",
    });
    expect(
      verifyMathAnswer({
        token: challenge!.token,
        answer: "4",
        secret: SECRET,
        nowMs: now + 2000,
      }).ok,
    ).toBe(false);
    expect(
      verifyMathAnswer({
        token: `${challenge!.token}x`,
        answer: "4",
        secret: SECRET,
        nowMs: now,
      }).ok,
    ).toBe(false);
  });

  it("does not use a production fallback secret", () => {
    expect(resolveContactChallengeSecret({ NODE_ENV: "production" })).toBeNull();
    expect(
      resolveContactChallengeSecret({ NODE_ENV: "production", CSRF_SECRET: "live" }),
    ).toBe("live");
  });

  it("consumes a nonce once", () => {
    expect(consumeMathNonce("n1", Date.now() + 10_000)).toBe(true);
    expect(consumeMathNonce("n1", Date.now() + 10_000)).toBe(false);
  });
});
