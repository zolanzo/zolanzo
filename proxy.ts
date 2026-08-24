import { NextResponse, type NextRequest } from "next/server";
import {
  applyCspToRequest,
  applySecurityHeaders,
} from "@/lib/security/headers";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { shouldRefreshAuthSession } from "@/lib/auth/route-policy";
import { decideProxyAccess } from "@/lib/auth/proxy-access";
import { CSRF_CONFIG, generateCsrfToken } from "@/lib/security/csrf";
import {
  CORRELATION_HEADER,
  REQUEST_ID_HEADER,
  generateCorrelationId,
  isValidCorrelationId,
  resolveCorrelationId,
} from "@/lib/observability/correlation";

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
    try {
      const { data } = await supabase.auth.getUser();
      authenticated = Boolean(data.user);
      if (data.user) {
        const appRoles = data.user.app_metadata?.roles;
        const userMetaRole = data.user.user_metadata?.role;
        userRole = (Array.isArray(appRoles) && appRoles[0]) || userMetaRole || "";

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
    } catch {
      authenticated = false;
      userRole = "";
      roles = [];
    }
  }

  const decision = decideProxyAccess({
    pathname,
    authenticated,
    roles,
    userRole,
    nodeEnv: process.env.NODE_ENV,
  });

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    if (decision.next) {
      url.searchParams.set("next", decision.next);
    } else {
      url.search = "";
    }
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
