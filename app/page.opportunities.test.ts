import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function homepage(): string {
  return readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
}

function socialOpportunities(): string {
  return readFileSync(
    resolve(process.cwd(), "components/home/home-social-opportunities.tsx"),
    "utf8",
  );
}

describe("homepage available opportunities is a compact social preview", () => {
  it("keeps the section heading and a single marketplace CTA", () => {
    const page = homepage();
    const preview = socialOpportunities();
    expect(page).toContain('id="available-tasks"');
    expect(page).toContain("Available Opportunities");
    expect(page).toContain("<HomeSocialOpportunities />");
    expect(preview).toContain("Social Media Tasks");
    expect(preview).toContain("Browse Social Media Tasks →");
    expect(preview).toContain('href="/tasks"');
    expect(preview.match(/href="\/tasks"/g)?.length).toBe(1);
  });

  it("does not keep the old placeholder task cards or fake metrics", () => {
    const page = homepage();
    const preview = socialOpportunities();
    const combined = `${page}\n${preview}`;
    expect(combined).not.toContain("AI Model Image Labeling");
    expect(combined).not.toContain("Customer Live Chat Support");
    expect(combined).not.toContain("Brand Post Engagement");
    expect(combined).not.toContain("Apply Task");
    expect(combined).not.toContain("High Pay");
    expect(combined).not.toContain("23 Earners Active");
    expect(combined).not.toContain("147 Slots Left");
    expect(combined).not.toContain("View All Marketplace Tasks");
    expect(combined).not.toContain("₦850");
    expect(combined).not.toContain("₦350");
    expect(combined).not.toContain("₦5,000");
  });

  it("uses colorful BrandIcon marks instead of monochrome social SVGs", () => {
    const preview = socialOpportunities();
    expect(preview).toContain("BrandIcon");
    expect(preview).not.toContain("SocialBrandIcon");
    expect(preview).not.toContain("/icons/social/");
    expect(preview).not.toContain("monochrome");
  });
});
