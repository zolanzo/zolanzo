/**
 * Path-based workspace chrome. Matches the existing sidebar / bottom-nav split.
 * Does not change routes; only which header control is shown.
 */
export function isAdminWorkspacePath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/lex");
}

export function isHirerWorkspacePath(pathname: string): boolean {
  return pathname.startsWith("/hirer");
}

/** Header wallet target, or null when Wallet does not belong on this chrome. */
export function headerWalletHref(pathname: string): string | null {
  if (isAdminWorkspacePath(pathname)) {
    return null;
  }
  if (isHirerWorkspacePath(pathname)) {
    return "/hirer/wallet";
  }
  return "/wallet";
}
