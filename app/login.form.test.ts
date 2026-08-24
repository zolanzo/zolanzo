import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("login form does not leak PIN through a GET submit", () => {
  it("posts the login form instead of appending PIN to the query string", () => {
    const page = readFileSync(resolve(process.cwd(), "app/login/page.tsx"), "utf8");
    expect(page).toContain('method="post"');
    expect(page).toContain('action="/login"');
    expect(page).toContain("handleSubmit");
  });
});
