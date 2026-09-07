import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { buildNoIndexMetadata, buildPageMetadata } from "@/components/seo/build-metadata";
import { SITE_CONFIG } from "@/constants/site";

const origin = SITE_CONFIG.url.replace(/\/$/, "");

describe("Phase 13 public SEO", () => {
  it("lists the public marketing and legal URLs and omits app routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual([
      origin,
      `${origin}/about`,
      `${origin}/pricing`,
      `${origin}/faq`,
      `${origin}/contact`,
      `${origin}/terms`,
      `${origin}/privacy`,
    ]);
    expect(urls.join(" ")).not.toContain("/login");
    expect(urls.join(" ")).not.toContain("/tasks");
    expect(urls.join(" ")).not.toContain("/earner");
    expect(urls.join(" ")).not.toContain("/how-it-works");
  });

  it("disallows authenticated and API prefixes in robots.txt", () => {
    const spec = robots();
    const rules = Array.isArray(spec.rules) ? spec.rules[0] : spec.rules;
    expect(rules).toBeDefined();
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toEqual(
      expect.arrayContaining([
        "/earner",
        "/hirer",
        "/lex",
        "/admin",
        "/tasks",
        "/wallet",
        "/api/",
        "/auth",
      ]),
    );
    expect(spec.sitemap).toBe(`${origin}/sitemap.xml`);
  });

  it("keeps public pages indexable with per-path canonicals", () => {
    const about = buildPageMetadata({
      title: "About",
      description: "ZOLANZO is a workforce marketplace for digital work across Africa.",
      path: "/about",
    });
    expect(about.robots).toEqual({ index: true, follow: true });
    expect(about.alternates?.canonical).toBe(`${origin}/about`);
    expect(about.twitter).toMatchObject({ card: "summary" });
  });

  it("marks auth and app surfaces noindex with unique canonicals", () => {
    const login = buildNoIndexMetadata("/login", "Log in");
    expect(login.robots).toEqual({ index: false, follow: false });
    expect(login.alternates?.canonical).toBe(`${origin}/login`);
    expect(login.title).toBe("Log in | ZOLANZO");

    const tasks = buildNoIndexMetadata("/tasks", "Tasks");
    expect(tasks.robots).toEqual({ index: false, follow: false });
    expect(tasks.alternates?.canonical).toBe(`${origin}/tasks`);
  });

  it("uses sized favicon assets instead of the full-resolution brand icon", () => {
    const metadata = buildPageMetadata();
    const icons = metadata.icons;
    expect(icons && typeof icons === "object" && !Array.isArray(icons)).toBe(true);
    const iconList = (icons as { icon: Array<{ url: string }> }).icon;
    expect(iconList.map((item) => item.url)).toEqual([
      "/brand/icon-32.webp",
      "/brand/icon-192.webp",
    ]);
    expect(readFileSync(resolve("app/manifest.ts"), "utf8")).toContain(
      "/brand/icon-512.webp",
    );
    expect(readFileSync(resolve("app/not-found.tsx"), "utf8")).toContain(
      "index: false",
    );
    expect(readFileSync(resolve("app/login/layout.tsx"), "utf8")).toContain(
      'buildNoIndexMetadata("/login"',
    );
  });
});
