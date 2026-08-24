import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTO_LIGHT_END_HOUR,
  AUTO_LIGHT_START_HOUR,
  THEME_BROWSER_COLOR_DARK,
  THEME_BROWSER_COLOR_LIGHT,
  THEME_OVERRIDE_UNTIL_KEY,
  THEME_STORAGE_KEY,
} from "@/lib/theme/constants";
import { THEME_INIT_SCRIPT } from "@/lib/theme/init-script";

const TOKEN_PATH = resolve(process.cwd(), "styles/tokens.css");

function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(open + 1, i);
      }
    }
  }
  throw new Error(`Unclosed block for ${selector}`);
}

function declaredValue(blockCss: string, name: string): string {
  const match = blockCss.match(new RegExp(`${name}:\\s*([^;]+);`));
  const value = match?.[1]?.trim().toLowerCase();
  if (!value) {
    throw new Error(`${name} must be declared`);
  }
  return value;
}

describe("semantic theme tokens", () => {
  const css = readFileSync(TOKEN_PATH, "utf8");
  const light = block(css, ":root");
  const dark = block(css, ".dark");

  const semantic = [
    "--background",
    "--background-secondary",
    "--foreground",
    "--foreground-secondary",
    "--foreground-disabled",
    "--surface",
    "--elevated",
    "--card",
    "--card-foreground",
    "--muted",
    "--muted-foreground",
    "--disabled",
    "--border",
    "--border-strong",
    "--input",
    "--input-background",
    "--header",
    "--footer",
    "--sidebar",
    "--sidebar-foreground",
    "--topbar",
    "--primary",
    "--primary-hover",
    "--primary-subtle",
    "--button-background",
    "--accent",
    "--accent-subtle",
    "--overlay",
    "--hover",
    "--selected",
    "--shadow-soft",
  ] as const;

  it("defines the full semantic set in both light and dark", () => {
    for (const name of semantic) {
      declaredValue(light, name);
      declaredValue(dark, name);
    }
  });

  it("does not copy light surfaces into dark", () => {
    expect(declaredValue(dark, "--background")).not.toBe(
      declaredValue(light, "--background"),
    );
    expect(declaredValue(dark, "--card")).not.toBe(declaredValue(light, "--card"));
    expect(declaredValue(dark, "--foreground")).not.toBe(
      declaredValue(light, "--foreground"),
    );
    expect(declaredValue(dark, "--surface")).not.toBe(
      declaredValue(light, "--surface"),
    );
    expect(declaredValue(dark, "--sidebar")).not.toBe(
      declaredValue(light, "--sidebar"),
    );
  });

  it("keeps the live emerald primary in both themes", () => {
    expect(declaredValue(light, "--primary")).toBe("#059669");
    expect(declaredValue(dark, "--primary")).toBe("#059669");
    expect(declaredValue(dark, "--background")).toBe("#050608");
    expect(declaredValue(dark, "--card")).toBe("#131922");
  });
});

describe("theme init script", () => {
  it("uses the shared storage key and local-hour schedule", () => {
    expect(THEME_INIT_SCRIPT).toContain(THEME_OVERRIDE_UNTIL_KEY);
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_INIT_SCRIPT).toContain(String(AUTO_LIGHT_START_HOUR));
    expect(THEME_INIT_SCRIPT).toContain(String(AUTO_LIGHT_END_HOUR));
    expect(THEME_INIT_SCRIPT).toContain('classList.toggle("dark"');
    expect(THEME_INIT_SCRIPT).toContain('classList.toggle("light"');
    expect(THEME_INIT_SCRIPT).toContain("data-theme");
    expect(THEME_INIT_SCRIPT).toContain("data-theme-preference");
    expect(THEME_INIT_SCRIPT).toContain("document.cookie");
    expect(THEME_INIT_SCRIPT).toContain(THEME_BROWSER_COLOR_LIGHT);
    expect(THEME_INIT_SCRIPT).toContain(THEME_BROWSER_COLOR_DARK);
    expect(THEME_INIT_SCRIPT).not.toContain("prefers-color-scheme");
    expect(THEME_INIT_SCRIPT).not.toContain('"auto"');
    expect(THEME_INIT_SCRIPT).not.toContain("m=\"auto\"");
  });
});

describe("root layout theme ownership", () => {
  it("does not hardcode html.dark and boots from the nonce script", () => {
    const layout = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/className=\{`dark /);
    expect(layout).toContain("THEME_INIT_SCRIPT");
    expect(layout).toContain("nonce={nonce}");
    expect(layout).toContain("suppressHydrationWarning");
    expect(layout).toContain("ssrPreference");
    expect(layout).not.toContain("prefers-color-scheme");
  });
});

describe("brand color constants follow live tokens", () => {
  it("keeps brand, CSS, and browser chrome on the same surfaces", async () => {
    const { BRAND_COLORS } = await import("@/constants/brand");
    const { COLOR } = await import("@/constants/design-tokens");

    expect(BRAND_COLORS.primary).toBe(COLOR.primary);
    expect(BRAND_COLORS.primaryTeal).toBe(COLOR.primary);
    expect(BRAND_COLORS.background).toBe(COLOR.lightBackground);
    expect(BRAND_COLORS.darkBackground).toBe(COLOR.darkBackground);
    expect(THEME_BROWSER_COLOR_LIGHT.toLowerCase()).toBe(
      COLOR.lightBackground.toLowerCase(),
    );
    expect(THEME_BROWSER_COLOR_DARK.toLowerCase()).toBe(
      COLOR.darkBackground.toLowerCase(),
    );
  });
});
