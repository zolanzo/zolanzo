import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyResolvedTheme } from "@/lib/theme/apply-theme";
import {
  THEME_BROWSER_COLOR_DARK,
  THEME_BROWSER_COLOR_LIGHT,
} from "@/lib/theme/constants";

type AttrMap = Record<string, string>;

function installDocumentMock() {
  const classes = new Set<string>();
  const attrs: AttrMap = {};
  const style = { colorScheme: "" };
  const metas: Array<{ content: string; media?: string }> = [];

  const documentElement = {
    classList: {
      toggle(name: string, force?: boolean) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains(name: string) {
        return classes.has(name);
      },
    },
    style,
    setAttribute(name: string, value: string) {
      attrs[name] = value;
    },
    getAttribute(name: string) {
      return attrs[name] ?? null;
    },
  };

  const documentMock = {
    documentElement,
    querySelectorAll(selector: string) {
      if (selector === 'meta[name="theme-color"]') {
        return metas.map((meta) => ({
          removeAttribute(name: string) {
            if (name === "media") delete meta.media;
          },
          setAttribute(name: string, value: string) {
            if (name === "content") meta.content = value;
          },
        }));
      }
      return [];
    },
    createElement(tag: string) {
      if (tag !== "meta") {
        throw new Error(`unexpected element: ${tag}`);
      }
      const meta = { content: "", media: undefined as string | undefined };
      return {
        setAttribute(name: string, value: string) {
          if (name === "content") meta.content = value;
        },
        _meta: meta,
      };
    },
    head: {
      appendChild(node: { _meta?: { content: string } }) {
        if (node._meta) metas.push(node._meta);
      },
    },
  };

  const previous = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: documentMock,
  });

  return {
    classes,
    attrs,
    style,
    metas,
    restore() {
      if (previous === undefined) {
        Reflect.deleteProperty(globalThis, "document");
      } else {
        Object.defineProperty(globalThis, "document", {
          configurable: true,
          value: previous,
        });
      }
    },
  };
}

describe("applyResolvedTheme", () => {
  let mock: ReturnType<typeof installDocumentMock>;

  beforeEach(() => {
    mock = installDocumentMock();
  });

  afterEach(() => {
    mock.restore();
  });

  it("applies dark class, color-scheme, and browser chrome color", () => {
    applyResolvedTheme("dark");
    expect(mock.classes.has("dark")).toBe(true);
    expect(mock.classes.has("light")).toBe(false);
    expect(mock.style.colorScheme).toBe("dark");
    expect(mock.attrs["data-theme"]).toBe("dark");
    expect(mock.attrs["data-theme-preference"]).toBe("dark");
    expect(mock.metas[0]?.content).toBe(THEME_BROWSER_COLOR_DARK);
  });

  it("applies light class, color-scheme, and browser chrome color", () => {
    applyResolvedTheme("light");
    expect(mock.classes.has("light")).toBe(true);
    expect(mock.classes.has("dark")).toBe(false);
    expect(mock.style.colorScheme).toBe("light");
    expect(mock.attrs["data-theme"]).toBe("light");
    expect(mock.attrs["data-theme-preference"]).toBe("light");
    expect(mock.metas[0]?.content).toBe(THEME_BROWSER_COLOR_LIGHT);
  });
});
