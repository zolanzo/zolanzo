import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function homepage(): string {
  return readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
}

describe("homepage hero stays a marketing hero", () => {
  it("keeps positioning copy and two primary pathways", () => {
    const page = homepage();
    expect(page).toContain("Africa&apos;s #1 Digital Workforce Marketplace");
    expect(page).toContain("Work that");
    expect(page).toContain("Simple online tasks. Real income.");
    expect(page).toContain("Find Work");
    expect(page).toContain("Hire Talent");
    expect(page).toContain("How It Works");
    expect(page).toContain('href="/tasks"');
    expect(page).toContain('href="/signup"');
    expect(page).toContain('href="/#how-it-works"');
  });

  it("does not put dashboard mock UI on the homepage", () => {
    const page = homepage();
    expect(page).not.toContain("Launch Earner Dashboard");
    expect(page).not.toContain("Earner Product Interface");
    expect(page).not.toContain("Product Dashboards");
    expect(page).not.toContain("Launch Hire Dashboard");
    expect(page).not.toContain("Today&apos;s Earnings");
    expect(page).not.toContain("Campaign Budget");
    expect(page).not.toContain("Activity Timeline");
    expect(page).not.toContain("Success Stories");
  });
});
