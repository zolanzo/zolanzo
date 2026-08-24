import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function homepage(): string {
  return readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");
}

function productDashboards(): string {
  const page = homepage();
  const start = page.indexOf("SECTION 6");
  const end = page.indexOf("SECTION 7");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return page.slice(start, end);
}

describe("homepage hero product preview is not repeated later", () => {
  it("keeps a single Earner Dashboard preview in the hero", () => {
    const page = homepage();
    expect(page.match(/Launch Earner Dashboard/g)?.length).toBe(1);
    expect(page.match(/Today&apos;s Earnings/g)?.length).toBe(1);
    expect(page.match(/Wallet Balance/g)?.length).toBe(1);
    expect(page.match(/Tasks Completed/g)?.length).toBe(1);
    expect(page).not.toContain("Activity Timeline");
  });

  it("keeps a distinct Hire Dashboard in Product Dashboards", () => {
    const section = productDashboards();
    expect(section).toContain("Launch Hire Dashboard");
    expect(section).toContain("Campaign Budget");
    expect(section).not.toContain("Launch Earner Dashboard");
    expect(section).not.toContain("Today&apos;s Earnings");
    expect(section).not.toContain("Activity Timeline");
  });
});
