import { describe, expect, it } from "vitest";
import {
  DEV_ONLY_ROUTE_PREFIXES,
  isDevOnlyRoute,
  isDevOnlyRoutePublic,
} from "@/lib/dev/dev-surfaces";

describe("dev-only product surfaces", () => {
  it("lists the production-blocked demo routes", () => {
    expect(DEV_ONLY_ROUTE_PREFIXES).toEqual([
      "/design-system",
      "/dev/product-preview",
      "/dev/icon-gallery",
    ]);
  });

  it("matches those routes and nested paths", () => {
    expect(isDevOnlyRoute("/design-system")).toBe(true);
    expect(isDevOnlyRoute("/design-system/tokens")).toBe(true);
    expect(isDevOnlyRoute("/dev/product-preview")).toBe(true);
    expect(isDevOnlyRoute("/dev/icon-gallery")).toBe(true);
    expect(isDevOnlyRoute("/faq")).toBe(false);
    expect(isDevOnlyRoute("/dev")).toBe(false);
  });

  it("is not publicly available in production or test", () => {
    expect(isDevOnlyRoutePublic("production")).toBe(false);
    expect(isDevOnlyRoutePublic("test")).toBe(false);
    expect(isDevOnlyRoutePublic("development")).toBe(true);
  });
});
