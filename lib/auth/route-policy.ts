/**
 * Route access policy — used by middleware and server guards.
 */

export type RouteAccessLevel =
  | "public"
  | "authenticated"
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
  { prefix: "/app", access: "authenticated" },
  { prefix: "/settings", access: "authenticated" },
  { prefix: "/auth", access: "public" },
  { prefix: "/health", access: "public" },
  { prefix: "/readiness", access: "public" },
  { prefix: "/version", access: "public" },
  { prefix: "/design-system", access: "public" },
  { prefix: "/templates", access: "public" },
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
    pathname === "/auth/sign-in" ||
    pathname === "/auth/sign-up" ||
    pathname === "/auth/forgot-password"
  );
}

export const ACTIVE_ORG_COOKIE = "zolanzo_active_org";
export const REMEMBER_ME_COOKIE = "zolanzo_remember";
