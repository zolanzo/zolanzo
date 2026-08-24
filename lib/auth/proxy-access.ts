import {
  isAuthEntryPath,
  resolveRouteAccess,
  type RouteAccessLevel,
} from "@/lib/auth/route-policy";
import { isLocalUiPreview } from "@/lib/dev/local-ui";

export type ProxyAccessDecision =
  | { action: "next" }
  | { action: "redirect"; pathname: string; next?: string };

function hasRole(roles: unknown, required: string | string[]): boolean {
  if (!Array.isArray(roles)) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((r) => roles.includes(r));
}

export function meetsAccess(
  access: RouteAccessLevel,
  opts: { authenticated: boolean; roles: unknown },
): boolean {
  switch (access) {
    case "public":
      return true;
    case "authenticated":
    case "onboarding":
    case "organization":
      return opts.authenticated;
    case "staff":
      return (
        opts.authenticated &&
        hasRole(opts.roles, ["staff", "admin", "super_admin"])
      );
    case "admin":
    case "super_admin":
      return (
        opts.authenticated && hasRole(opts.roles, ["admin", "super_admin"])
      );
    case "developer":
      return (
        opts.authenticated &&
        hasRole(opts.roles, ["developer", "admin", "super_admin"])
      );
    default:
      return false;
  }
}

export function getRoleHomePath(role: string): string {
  if (!role) {
    return "/login?error=RoleUnresolved";
  }
  const normalized = role.toLowerCase();
  if (normalized === "admin" || normalized === "super_admin") {
    return "/lex/auth";
  }
  if (normalized === "staff") {
    return "/lex/staff";
  }
  if (normalized === "employer" || normalized === "hirer") {
    return "/hirer/dashboard";
  }
  if (normalized === "worker" || normalized === "earner") {
    return "/earner/dashboard";
  }
  return "/login?error=InvalidRole";
}

/**
 * Production: unauthenticated users never receive protected pages.
 * Development: unauthenticated users may view empty layouts for UI work.
 * Authenticated role isolation is unchanged in every environment.
 */
export function decideProxyAccess(input: {
  pathname: string;
  authenticated: boolean;
  roles: string[];
  userRole: string;
  nodeEnv?: string;
}): ProxyAccessDecision {
  const access = resolveRouteAccess(input.pathname);

  if (!meetsAccess(access, { authenticated: input.authenticated, roles: input.roles })) {
    if (
      !input.authenticated &&
      isLocalUiPreview(input.nodeEnv)
    ) {
      return { action: "next" };
    }
    if (!input.authenticated) {
      return { action: "redirect", pathname: "/login", next: input.pathname };
    }
    return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
  }

  if (input.authenticated && isAuthEntryPath(input.pathname)) {
    return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
  }

  if (
    input.authenticated &&
    (input.pathname === "/onboarding" || input.pathname.startsWith("/onboarding/"))
  ) {
    const normRole = input.userRole.toLowerCase();
    if (
      normRole === "admin" ||
      normRole === "super_admin" ||
      normRole === "staff"
    ) {
      return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
    }
  }

  const normRole = input.userRole.toLowerCase();
  const isSuperOrAdmin = normRole === "admin" || normRole === "super_admin";

  if (input.authenticated && !isSuperOrAdmin) {
    if (
      input.pathname.startsWith("/earner") &&
      normRole !== "worker" &&
      normRole !== "earner"
    ) {
      return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
    }
    if (
      input.pathname.startsWith("/hirer") &&
      normRole !== "employer" &&
      normRole !== "hirer"
    ) {
      return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
    }
    if (input.pathname.startsWith("/lex/auth")) {
      return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
    }
    if (input.pathname.startsWith("/lex/staff") && normRole !== "staff") {
      return { action: "redirect", pathname: getRoleHomePath(input.userRole) };
    }
  }

  return { action: "next" };
}
