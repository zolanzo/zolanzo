/**
 * Route Access Policy — Used by middleware and server guards.
 * Earn / Hire Role & Routing Refactor
 */

export type RouteAccessLevel =
  | "public"
  | "authenticated"
  | "onboarding"
  | "organization"
  | "admin"
  | "super_admin"
  | "developer";

export type RouteRule = {
  prefix: string;
  access: RouteAccessLevel;
};

/**
 * First matching prefix wins (order matters — more specific first).
 */
export const ROUTE_RULES: readonly RouteRule[] = [
  { prefix: "/admin/super", access: "super_admin" },
  { prefix: "/admin", access: "admin" },
  { prefix: "/developer", access: "developer" },
  { prefix: "/onboarding", access: "onboarding" },
  { prefix: "/dashboard", access: "authenticated" },
  { prefix: "/profile", access: "authenticated" },
  { prefix: "/settings", access: "authenticated" },
  { prefix: "/wallet", access: "authenticated" },
  { prefix: "/tasks", access: "authenticated" },
  { prefix: "/applications", access: "authenticated" },
  { prefix: "/activity", access: "authenticated" },
  { prefix: "/referrals", access: "authenticated" },
  { prefix: "/notifications", access: "authenticated" },
  { prefix: "/support", access: "authenticated" },
  { prefix: "/earner", access: "authenticated" },
  { prefix: "/hire", access: "authenticated" },
  { prefix: "/worker", access: "authenticated" },
  { prefix: "/employer", access: "authenticated" },
  { prefix: "/api/webhooks", access: "public" },
  { prefix: "/api/v1", access: "public" },
  { prefix: "/api/auth", access: "public" },
  { prefix: "/api/payments/callback", access: "public" },
  { prefix: "/login", access: "public" },
  { prefix: "/signup", access: "public" },
  { prefix: "/register", access: "public" },
  { prefix: "/forgot-pin", access: "public" },
  { prefix: "/reset-pin", access: "public" },
  { prefix: "/verify-email", access: "public" },
  { prefix: "/verify-phone", access: "public" },
  { prefix: "/auth", access: "public" },
  { prefix: "/", access: "public" },
] as const;

export function resolveRouteAccess(pathname: string): RouteAccessLevel {
  for (const rule of ROUTE_RULES) {
    if (rule.prefix === "/") {
      return rule.access;
    }
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.access;
    }
  }
  return "public";
}

export function isAuthEntryPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/register" ||
    pathname === "/forgot-pin" ||
    pathname === "/auth/sign-in" ||
    pathname === "/auth/sign-up"
  );
}

export const ACTIVE_ORG_COOKIE = "zolanzo_active_org";
export const REMEMBER_ME_COOKIE = "zolanzo_remember";
