import { NextResponse, type NextRequest } from "next/server";
import {
  applyCspToRequest,
  applySecurityHeaders,
} from "@/lib/security/headers";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import {
  isAuthEntryPath,
  resolveRouteAccess,
  shouldRefreshAuthSession,
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
    case "onboarding":
    case "organization":
      return opts.authenticated;
    case "staff":
      return (
        opts.authenticated && hasRole(opts.roles, ["staff", "admin", "super_admin"])
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

function getRoleHomePath(role: string): string {
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
 * Next.js 16 Edge proxy: correlation IDs, security headers, CSRF cookie,
 * session refresh, RBAC route protection.
 */
export async function proxy(request: NextRequest) {
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
  applyCspToRequest(requestHeaders, nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(CORRELATION_HEADER, correlationId);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  applySecurityHeaders(response, nonce);

  if (!request.cookies.get(CSRF_CONFIG.cookie)?.value) {
    response.cookies.set(CSRF_CONFIG.cookie, generateCsrfToken(), {
      ...CSRF_CONFIG.cookieOptions,
    });
  }

  const { pathname } = request.nextUrl;
  const supabase = createSupabaseMiddlewareClient(request, response);
  let authenticated = false;
  let userRole = "";
  let roles: string[] = [];

  if (supabase && shouldRefreshAuthSession(pathname)) {
    const { data } = await supabase.auth.getUser();
    authenticated = Boolean(data.user);
    if (data.user) {
      const appRoles = data.user.app_metadata?.roles;
      const userMetaRole = data.user.user_metadata?.role;
      userRole = (Array.isArray(appRoles) && appRoles[0]) || userMetaRole || "";

      // Fallback to database profiles table lookup if Auth metadata role is missing
      if (!userRole && data.user.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prof } = await (supabase.from("profiles") as any)
          .select("role")
          .eq("id", data.user.id)
          .single();
        if (prof?.role) {
          userRole = prof.role;
        }
      }

      roles = userRole ? [userRole] : [];
    }
  }

  const access = resolveRouteAccess(pathname);

  // 1. Unauthenticated users trying to access protected paths -> redirect to /login
  if (!meetsAccess(access, { authenticated, roles })) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect, nonce);
    redirect.headers.set(CORRELATION_HEADER, correlationId);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  // 2. Authenticated users hitting /login or /signup -> redirect immediately to their role home
  if (authenticated && isAuthEntryPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = getRoleHomePath(userRole);
    url.search = "";
    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect, nonce);
    redirect.headers.set(CORRELATION_HEADER, correlationId);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  // 3. Staff/Admin trying to access /onboarding -> skip onboarding entirely to role home
  if (authenticated && (pathname === "/onboarding" || pathname.startsWith("/onboarding/"))) {
    const normRole = userRole.toLowerCase();
    if (normRole === "admin" || normRole === "super_admin" || normRole === "staff") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(userRole);
      const redirect = NextResponse.redirect(url);
      applySecurityHeaders(redirect, nonce);
      redirect.headers.set(CORRELATION_HEADER, correlationId);
      redirect.headers.set(REQUEST_ID_HEADER, requestId);
      return redirect;
    }
  }

  // 4. Role Guards: Prevent cross-role workspace intrusion
  const normRole = userRole.toLowerCase();
  const isSuperOrAdmin = normRole === "admin" || normRole === "super_admin";

  if (authenticated && !isSuperOrAdmin) {
    if (pathname.startsWith("/earner") && normRole !== "worker" && normRole !== "earner") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(userRole);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/hirer") && normRole !== "employer" && normRole !== "hirer") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(userRole);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/lex/auth")) {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(userRole);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/lex/staff") && normRole !== "staff") {
      const url = request.nextUrl.clone();
      url.pathname = getRoleHomePath(userRole);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
