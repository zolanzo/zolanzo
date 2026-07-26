import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { provisionAuthenticatedUser } from "@/features/authentication/services/provisioning";
import { writeAuditLog } from "@/lib/audit/write";
import { getEnv, isSupabaseConfigured } from "@/lib/validation/env";
import { logger } from "@/lib/observability/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase Auth PKCE / email callback.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";
  const env = getEnv();
  const origin = env.NEXT_PUBLIC_APP_URL;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=not_configured`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth/sign-in?error=not_configured`);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    logger.error("Auth callback failed", {
      span: "auth.callback",
      err: { message: error?.message ?? "no user" },
    });
    return NextResponse.redirect(`${origin}/auth/sign-in?error=callback`);
  }

  const displayName =
    (data.user.user_metadata?.display_name as string | undefined) ||
    data.user.email?.split("@")[0] ||
    "User";

  try {
    const provisioned = await provisionAuthenticatedUser({
      authSubject: data.user.id,
      email: data.user.email ?? `${data.user.id}@users.zolanzo.local`,
      displayName,
      emailVerified: Boolean(data.user.email_confirmed_at),
    });

    if (data.user.email_confirmed_at) {
      await writeAuditLog({
        actorUserId: provisioned.userId,
        action: "email.verified",
        resourceType: "user",
        resourceId: provisioned.userId,
      });
    }
  } catch (err) {
    logger.error("Provisioning after callback failed", {
      span: "auth.callback.provision",
      err:
        err instanceof Error
          ? { name: err.name, message: err.message }
          : { message: String(err) },
    });
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/app"}`);
}
