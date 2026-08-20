/**
 * Route Access Policy — Used by middleware and server guards.
 * Unified Architecture:
 * - Public: /, /login, /signup, /careers, /forgot-password, /forgot-pin, /reset-pin, /verify-email, /verify-phone
 * - Earn: /earner/dashboard
 * - Hire: /hirer/dashboard
 * - Staff: /lex/staff
 * - Super Admin: /lex/auth
 */

export type RouteAccessLevel =
  | "public"
  | "authenticated"
  | "onboarding"
  | "organization"
  | "staff"
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
  { prefix: "/lex/auth", access: "super_admin" },
  { prefix: "/lex/staff", access: "staff" },
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
  { prefix: "/hirer", access: "authenticated" },
  { prefix: "/app", access: "authenticated" },
  { prefix: "/api/webhooks", access: "public" },
  { prefix: "/api/v1", access: "public" },
  { prefix: "/api/auth", access: "public" },
  { prefix: "/api/payments/callback", access: "public" },
  { prefix: "/login", access: "public" },
  { prefix: "/signup", access: "public" },
  { prefix: "/careers", access: "public" },
  { prefix: "/forgot-password", access: "public" },
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
    pathname === "/forgot-password" ||
    pathname === "/forgot-pin" ||
    pathname === "/auth/sign-in" ||
    pathname === "/auth/sign-up"
  );
}

const PUBLIC_MARKETING_PATHS = [
  "/",
  "/about",
  "/careers",
  "/faq",
  "/pricing",
  "/contact",
] as const;

export function isPublicMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_MARKETING_PATHS.some(
    (path) =>
      path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)),
  );
}

export function shouldRefreshAuthSession(pathname: string): boolean {
  return !isPublicMarketingPath(pathname);
}

export const ACTIVE_ORG_COOKIE = "zolanzo_active_org";
export const REMEMBER_ME_COOKIE = "zolanzo_remember";
