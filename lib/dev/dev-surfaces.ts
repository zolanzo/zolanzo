import { isLocalUiPreview } from "@/lib/dev/local-ui";

/** Development/demo App Router surfaces that must not be public in production. */
export const DEV_ONLY_ROUTE_PREFIXES = [
  "/design-system",
  "/dev/product-preview",
  "/dev/icon-gallery",
] as const;

export function isDevOnlyRoute(pathname: string): boolean {
  return DEV_ONLY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** True only for `next dev`. Production builds and `next start` stay closed. */
export function isDevOnlyRoutePublic(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return isLocalUiPreview(nodeEnv);
}
