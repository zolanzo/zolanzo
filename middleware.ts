import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import {
  isAuthEntryPath,
  resolveRouteAccess,
  type RouteAccessLevel,
} from "@/lib/auth/route-policy";
import { CSRF_CONFIG, generateCsrfToken } from "@/lib/security/csrf";
import {
  CORRELATION_HEADER,
  REQUEST_ID_HEADER,
  generateCorrelationId,
  isValidCorrelationId,
  resolveCorrelationId,
} from "@/lib/observability/correlation";

function hasRole(roles: unknown, required: string | string[]): boolean {
  if (!Array.isArray(roles)) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((r) => roles.includes(r));
}

function meetsAccess(
  access: RouteAccessLevel,
  opts: { authenticated: boolean; roles: unknown },
): boolean {
  switch (access) {
    case "public":
      return true;
    case "authenticated":
    case "organization":
      return opts.authenticated;
    case "admin":
      return (
        opts.authenticated && hasRole(opts.roles, ["admin", "super_admin"])
      );
    case "super_admin":
      return opts.authenticated && hasRole(opts.roles, "super_admin");
    case "developer":
      return (
        opts.authenticated &&
        hasRole(opts.roles, ["developer", "admin", "super_admin"])
      );
    default:
      return false;
  }
}

/**
 * Edge middleware: correlation IDs, security headers, CSRF cookie,
 * session refresh, route protection.
 */
export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());

  const correlationId = resolveCorrelationId(request.headers);
  const inboundRequestId = request.headers.get(REQUEST_ID_HEADER);
  const requestId =
    inboundRequestId && isValidCorrelationId(inboundRequestId)
      ? inboundRequestId.trim()
      : generateCorrelationId();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_HEADER, correlationId);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-nonce", nonce);
  response.headers.set(CORRELATION_HEADER, correlationId);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  applySecurityHeaders(response, nonce);

  if (!request.cookies.get(CSRF_CONFIG.cookie)?.value) {
    response.cookies.set(CSRF_CONFIG.cookie, generateCsrfToken(), {
      ...CSRF_CONFIG.cookieOptions,
    });
  }

  const supabase = createSupabaseMiddlewareClient(request, response);
  let authenticated = false;
  let roles: unknown = [];

  if (supabase) {
    const { data } = await supabase.auth.getUser();
    authenticated = Boolean(data.user);
    roles = data.user?.app_metadata?.roles ?? [];
  }

  const { pathname } = request.nextUrl;
  const access = resolveRouteAccess(pathname);

  if (!meetsAccess(access, { authenticated, roles })) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect, nonce);
    redirect.headers.set(CORRELATION_HEADER, correlationId);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  if (authenticated && isAuthEntryPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect, nonce);
    redirect.headers.set(CORRELATION_HEADER, correlationId);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
