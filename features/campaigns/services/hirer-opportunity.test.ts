import { describe, expect, it } from "vitest";
import {
  validateHirerOpportunityInput,
  splitScopeList,
} from "@/features/campaigns/services/hirer-opportunity";

const valid = {
  title: "Follow on Instagram",
  category: "Instagram",
  description: "Ask workers to follow the brand page",
  instructions: "Open the profile and tap Follow. Submit the confirmation screenshot.",
  requirements: "Screenshot of the follow state",
  rewardNaira: 250,
  slots: 10,
  taskTemplateId: "tpl_1",
  countries: "NG",
  languages: "",
  platform: "Instagram",
};

describe("hirer campaign validation", () => {
  it("accepts a complete campaign with positive reward, quantity, and budget", () => {
    const result = validateHirerOpportunityInput(valid);
    expect(result.ok).toBe(true);
    expect(result.budgetNaira).toBe(2500);
  });

  it("rejects missing required fields", () => {
    const result = validateHirerOpportunityInput({
      ...valid,
      title: "  ",
      description: "",
      instructions: "",
      taskTemplateId: "",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/Title/);
    expect(result.errors.join(" ")).toMatch(/Description/);
    expect(result.errors.join(" ")).toMatch(/Instructions/);
    expect(result.errors.join(" ")).toMatch(/template/);
  });

  it("rejects reward <= 0", () => {
    expect(validateHirerOpportunityInput({ ...valid, rewardNaira: 0 }).ok).toBe(
      false,
    );
    expect(validateHirerOpportunityInput({ ...valid, rewardNaira: -5 }).ok).toBe(
      false,
    );
  });

  it("rejects quantity < 1", () => {
    expect(validateHirerOpportunityInput({ ...valid, slots: 0 }).ok).toBe(false);
    expect(validateHirerOpportunityInput({ ...valid, slots: 1.5 }).ok).toBe(
      false,
    );
  });

  it("splits targeting lists without inventing values", () => {
    expect(splitScopeList("NG, GH")).toEqual(["NG", "GH"]);
    expect(splitScopeList("")).toEqual([]);
  });
});
