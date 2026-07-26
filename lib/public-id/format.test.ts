import { describe, expect, it } from "vitest";
import {
  counterKeyFor,
  formatDateSequentialPublicId,
  formatRandomPublicId,
  formatSequentialPublicId,
  formatYearSequentialPublicId,
  isValidPublicId,
  padSequence,
  randomPublicSegment,
} from "@/lib/public-id/format";
import { PUBLIC_ID_DEFINITIONS } from "@/constants/public-ids";

describe("public id formatting", () => {
  it("pads sequences", () => {
    expect(padSequence(14, 6)).toBe("000014");
  });

  it("formats random ids", () => {
    const id = formatRandomPublicId("organization", "9X4P2M");
    expect(id).toBe("ORG-9X4P2M");
    expect(isValidPublicId("organization", id)).toBe(true);
  });

  it("formats sequential and dated ids", () => {
    expect(formatSequentialPublicId("task_template", 127)).toBe("TPL-000127");
    expect(formatYearSequentialPublicId("campaign", "2026", 1)).toBe(
      "CMP-2026-000001",
    );
    expect(formatDateSequentialPublicId("transaction", "20260725", 14)).toBe(
      "TXN-20260725-000014",
    );
  });

  it("builds counter keys by strategy", () => {
    const when = new Date(Date.UTC(2026, 6, 25));
    expect(counterKeyFor("task_template", when)).toBe("task_template");
    expect(counterKeyFor("campaign", when)).toBe("campaign:2026");
    expect(counterKeyFor("transaction", when)).toBe("transaction:20260725");
  });

  it("generates alphabet-safe random segments", () => {
    const segment = randomPublicSegment(6, () =>
      Uint8Array.from([0, 1, 2, 3, 4, 5]),
    );
    expect(segment).toHaveLength(6);
    expect(isValidPublicId("task", formatRandomPublicId("task", segment))).toBe(
      true,
    );
  });

  it("documents an example for every entity", () => {
    for (const def of Object.values(PUBLIC_ID_DEFINITIONS)) {
      expect(def.example.startsWith(`${def.prefix}-`)).toBe(true);
    }
  });
});
