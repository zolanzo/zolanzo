import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetMathNonceStoreForTests, createMathChallenge } from "@/lib/contact/math-challenge";
import { submitContactMessage } from "@/lib/contact/submit";

const SECRET = "contact-submit-secret";
const send = vi.fn();

function validBody(overrides: Record<string, unknown> = {}) {
  const challenge = createMathChallenge({
    secret: SECRET,
    left: 3,
    right: 6,
    nonce: `nonce-${Math.random().toString(16).slice(2)}`,
  })!;
  return {
    name: "Ada Lovelace",
    email: "ada@example.com",
    subject: "general",
    message: "Please help with my login.",
    challengeToken: challenge.token,
    mathAnswer: "9",
    ...overrides,
  };
}

describe("contact submission", () => {
  beforeEach(() => {
    resetMathNonceStoreForTests();
    send.mockReset();
    send.mockResolvedValue({ success: true, id: "dev_1" });
  });

  it("rejects missing fields, invalid email, and invalid subject on the server", async () => {
    const missing = await submitContactMessage(
      { name: "", email: "", subject: "", message: "", challengeToken: "", mathAnswer: "" },
      { secret: SECRET, send },
    );
    expect(missing.ok).toBe(false);
    expect(send).not.toHaveBeenCalled();

    const email = await submitContactMessage(validBody({ email: "bad" }), {
      secret: SECRET,
      send,
    });
    expect(email.ok).toBe(false);

    const subject = await submitContactMessage(validBody({ subject: "not-a-category" }), {
      secret: SECRET,
      send,
    });
    expect(subject.ok).toBe(false);
  });

  it("rejects the wrong maths answer without sending", async () => {
    const result = await submitContactMessage(validBody({ mathAnswer: "8" }), {
      secret: SECRET,
      send,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MATH");
    expect(send).not.toHaveBeenCalled();
  });

  it("sends when the signed challenge answer is correct", async () => {
    const result = await submitContactMessage(validBody(), { secret: SECRET, send });
    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      email: "ada@example.com",
      subject: "general",
    });
  });

  it("returns a fresh challenge after a successful send", async () => {
    const first = validBody();
    const result = await submitContactMessage(first, { secret: SECRET, send });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.challenge.token).not.toBe(first.challengeToken);
    expect(result.data.challenge.prompt).toMatch(/^What is [1-9] \+ [1-9]\?$/);
  });

  it("does not send when delivery fails and keeps a generic error", async () => {
    send.mockResolvedValueOnce({ success: false });
    const result = await submitContactMessage(validBody(), { secret: SECRET, send });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DELIVERY");
      expect(result.error.message).toBe("Something went wrong. Please try again.");
      expect(result.error.message.toLowerCase()).not.toContain("resend");
    }
  });
});
