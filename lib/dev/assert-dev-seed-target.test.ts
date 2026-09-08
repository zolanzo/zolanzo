import { describe, expect, it } from "vitest";
import {
  assertDevelopmentSeedTarget,
  ZOLANZO_DEV_PROJECT_REF,
  ZOLANZO_PRODUCTION_PROJECT_REF,
} from "@/lib/dev/assert-dev-seed-target";

const DEV_URL = `https://${ZOLANZO_DEV_PROJECT_REF}.supabase.co`;
const DEV_DB = `postgresql://postgres:x@db.${ZOLANZO_DEV_PROJECT_REF}.supabase.co:5432/postgres`;

describe("assertDevelopmentSeedTarget", () => {
  it("allows development env with only zolanzo-dev refs", () => {
    expect(() =>
      assertDevelopmentSeedTarget({
        ZOLANZO_ENV: "development",
        DATABASE_URL: DEV_DB,
        DIRECT_URL: DEV_DB,
        NEXT_PUBLIC_SUPABASE_URL: DEV_URL,
        SUPABASE_URL: DEV_URL,
      }),
    ).not.toThrow();
  });

  it("aborts when ZOLANZO_ENV is not development", () => {
    expect(() =>
      assertDevelopmentSeedTarget({
        ZOLANZO_ENV: "production",
        DATABASE_URL: DEV_DB,
        NEXT_PUBLIC_SUPABASE_URL: DEV_URL,
      }),
    ).toThrow(/ZOLANZO_ENV must be development/);
  });

  it("aborts when a production ref appears", () => {
    expect(() =>
      assertDevelopmentSeedTarget({
        ZOLANZO_ENV: "development",
        DATABASE_URL: DEV_DB,
        NEXT_PUBLIC_SUPABASE_URL: `https://${ZOLANZO_PRODUCTION_PROJECT_REF}.supabase.co`,
      }),
    ).toThrow(/production project ref/);
  });

  it("aborts when any target omits the development ref", () => {
    expect(() =>
      assertDevelopmentSeedTarget({
        ZOLANZO_ENV: "development",
        DATABASE_URL: DEV_DB,
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow(/every connection target must include development ref/);
  });
});
