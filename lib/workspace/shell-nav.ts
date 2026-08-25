/**
 * Workspace chrome for sidebar / bottom-nav / header wallet.
 * Authenticated role wins when present; pathname is only a fallback
 * (dev empty preview and pages that do not pass a session role).
 */

export type ShellChrome = "super_admin" | "staff" | "hirer" | "earner";

function normalizeChromeRole(userRole: string | null | undefined): string {
  return (userRole ?? "").trim().toLowerCase();
}

/**
 * Map session platform roles (RBAC table keys) to the same role names
 * proxy access already uses: admin, staff, employer, worker.
 */
export function chromeRoleFromPlatformRoles(
  platformRoles: readonly string[],
): string {
  const roles = new Set(
    platformRoles.map((role) => role.trim().toLowerCase()).filter(Boolean),
  );
  if (roles.has("super_admin") || roles.has("admin")) return "admin";
  if (roles.has("staff")) return "staff";
  if (roles.has("client") || roles.has("advertiser")) return "employer";
  if (roles.has("worker")) return "worker";
  return "";
}

export function resolveShellChrome(
  pathname: string,
  userRole?: string | null,
): ShellChrome {
  const role = normalizeChromeRole(userRole);

  if (role === "admin" || role === "super_admin") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/lex/staff")) {
      return "staff";
    }
    return "super_admin";
  }
  if (role === "staff") {
    return "staff";
  }
  if (role === "employer" || role === "hirer" || role === "client") {
    return "hirer";
  }
  if (role === "worker" || role === "earner") {
    return "earner";
  }

  if (pathname.startsWith("/lex/auth")) {
    return "super_admin";
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/lex")) {
    return "staff";
  }
  if (pathname.startsWith("/hirer")) {
    return "hirer";
  }
  return "earner";
}

export function isAdminWorkspacePath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/lex");
}

export function isHirerWorkspacePath(pathname: string): boolean {
  return pathname.startsWith("/hirer");
}

/** Header wallet target, or null when Wallet does not belong on this chrome. */
export function headerWalletHref(
  pathname: string,
  userRole?: string | null,
): string | null {
  const chrome = resolveShellChrome(pathname, userRole);
  if (chrome === "super_admin" || chrome === "staff") {
    return null;
  }
  if (chrome === "hirer") {
    return "/hirer/wallet";
  }
  return "/wallet";
}
