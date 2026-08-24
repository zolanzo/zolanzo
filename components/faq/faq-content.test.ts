import { describe, expect, it } from "vitest";
import {
  FAQ_GROUPS,
  FAQ_ITEMS,
  PRESERVED_HOMEPAGE_FAQ_QUESTIONS,
} from "@/components/faq/faq-content";

describe("FAQ content", () => {
  it("preserves the original homepage questions and answers", () => {
    const questions = FAQ_ITEMS.map((faq) => faq.question);
    for (const question of PRESERVED_HOMEPAGE_FAQ_QUESTIONS) {
      expect(questions).toContain(question);
    }

    const whoCanJoin = FAQ_ITEMS.find((faq) => faq.question === "Who can join ZOLANZO?");
    expect(whoCanJoin?.answer).toContain("create a free account on ZOLANZO");

    const getPaid = FAQ_ITEMS.find((faq) => faq.question === "How do I get paid?");
    expect(getPaid?.answer).toContain("minimum withdrawal requirement");
  });

  it("does not duplicate questions or the WhatsApp number in answers", () => {
    const questions = FAQ_ITEMS.map((faq) => faq.question);
    expect(new Set(questions).size).toBe(questions.length);
    expect(FAQ_ITEMS.some((faq) => faq.answer.includes("704 555 9401"))).toBe(false);
  });

  it("groups questions without inventing fee or timeline guarantees", () => {
    expect(FAQ_GROUPS.map((group) => group.title)).toEqual([
      "Getting started",
      "Finding work",
      "Task completion",
      "Earnings & withdrawals",
      "Hiring on ZOLANZO",
      "Safety & trust",
      "Account & support",
    ]);
    expect(FAQ_ITEMS.some((faq) => /72 hours|6 to 24 hours/i.test(faq.answer))).toBe(false);
    expect(FAQ_ITEMS.some((faq) => /%\s*fee|service fee|platform fee/i.test(faq.answer))).toBe(
      false,
    );
  });
});
