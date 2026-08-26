import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";
import { AppError, apiError, apiSuccess, type ApiResponse } from "@/lib/api/response";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  type SignInInput,
  type SignUpInput,
} from "@/features/authentication/validators/auth";
import { provisionAuthenticatedUser } from "@/features/authentication/services/provisioning";
import { writeAuditLog } from "@/lib/audit/write";
import { rateLimit, RATE_LIMIT_PRESETS } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/validation/env";
import {
  deviceFingerprint,
  generateOpaqueToken,
  sha256Hex,
} from "@/lib/auth/identity-helpers";
import { prisma } from "@/lib/prisma/client";
import { REMEMBER_ME_COOKIE, ACTIVE_ORG_COOKIE } from "@/lib/auth/route-policy";
import { SECURITY_CONFIG } from "@/config/security";
import { isDatabaseConfigured } from "@/lib/validation/env";
import { AuthService } from "@/lib/auth/service";

function requireSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new AppError(
      "SUPABASE_NOT_CONFIGURED",
      "Authentication is not configured. Set Supabase environment variables.",
      503,
    );
  }
}

async function enforceAuthRateLimit(key: string): Promise<void> {
  const result = await rateLimit(key, RATE_LIMIT_PRESETS.auth);
  if (!result.success) {
    throw new AppError("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }
}

async function setRememberCookie(rememberMe: boolean): Promise<void> {
  const cookieStore = await cookies();
  if (rememberMe) {
    cookieStore.set(REMEMBER_ME_COOKIE, "1", {
      httpOnly: true,
      sameSite: SECURITY_CONFIG.cookies.sameSite,
      secure:
        process.env.NODE_ENV === "production" ||
        SECURITY_CONFIG.cookies.secureInProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    cookieStore.delete(REMEMBER_ME_COOKIE);
  }
}

async function trackSession(params: {
  userId: string;
  accessToken: string;
  ip?: string | null;
  userAgent?: string | null;
  rememberMe?: boolean;
}): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const tokenHash = await sha256Hex(params.accessToken);
  const ttlHours = params.rememberMe
    ? SECURITY_CONFIG.sessions.absoluteTtlHours * 2
    : SECURITY_CONFIG.sessions.absoluteTtlHours;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const fingerprint = deviceFingerprint({
    userAgent: params.userAgent,
    ip: params.ip,
  });

  await prisma.session.upsert({
    where: { tokenHash },
    create: {
      userId: params.userId,
      tokenHash,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      expiresAt,
    },
    update: {
      expiresAt,
      revokedAt: null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  await prisma.device.upsert({
    where: {
      userId_fingerprint: {
        userId: params.userId,
        fingerprint,
      },
    },
    create: {
      userId: params.userId,
      fingerprint,
      name: params.userAgent?.slice(0, 80) ?? "Unknown device",
      trustedAt: new Date(),
      lastSeenAt: new Date(),
    },
    update: {
      lastSeenAt: new Date(),
      revokedAt: null,
    },
  });
}

export async function signUpWithEmail(
  raw: SignUpInput,
  meta: { ip?: string | null; userAgent?: string | null },
): Promise<ApiResponse<{ needsEmailVerification: boolean }>> {
  try {
    const input = signUpSchema.parse(raw);
    await enforceAuthRateLimit(`signup:${meta.ip ?? input.email}`);
    throw new AppError(
      "SIGNUP_FAILED",
      "Create your account with email and PIN at /signup.",
      400,
    );
  } catch (error) {
    if (error instanceof AppError) {
      return error.toApiError();
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("VALIDATION_ERROR", "Invalid signup input");
    }
    return apiError(
      "SIGNUP_FAILED",
      error instanceof Error ? error.message : "Signup failed",
    );
  }
}

export async function signInWithEmail(
  raw: SignInInput,
  meta: { ip?: string | null; userAgent?: string | null },
): Promise<ApiResponse<{ userId: string }>> {
  try {
    requireSupabaseConfigured();
    const input = signInSchema.parse(raw);
    await enforceAuthRateLimit(`signin:${meta.ip ?? input.email}`);

    const supabase = await createSupabaseServerActionClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error || !data.user || !data.session) {
      await writeAuditLog({
        action: "login.failed",
        resourceType: "auth",
        ip: meta.ip,
        metadata: { email: input.email, reason: error?.message ?? "unknown" },
      });
      throw new AppError(
        "INVALID_CREDENTIALS",
        error?.message ?? "Invalid email or password",
        401,
      );
    }

    const displayName =
      (data.user.user_metadata?.display_name as string | undefined) ||
      input.email.split("@")[0] ||
      "User";

    const provisioned = await provisionAuthenticatedUser({
      authSubject: data.user.id,
      email: data.user.email ?? input.email,
      displayName,
      emailVerified: Boolean(data.user.email_confirmed_at),
      ip: meta.ip,
    });

    // Rotate app session token hash on each login
    await trackSession({
      userId: provisioned.userId,
      accessToken: data.session.access_token,
      ip: meta.ip,
      userAgent: meta.userAgent,
      rememberMe: input.rememberMe,
    });

    await setRememberCookie(Boolean(input.rememberMe));

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, provisioned.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    await writeAuditLog({
      actorUserId: provisioned.userId,
      action: "login.succeeded",
      resourceType: "session",
      organizationId: provisioned.organizationId,
      ip: meta.ip,
    });

    return apiSuccess({ userId: provisioned.userId });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError(
      "SIGNIN_FAILED",
      error instanceof Error ? error.message : "Sign in failed",
    );
  }
}

export async function signOutCurrent(
  meta: { userId?: string | null; ip?: string | null } = {},
): Promise<ApiResponse<{ signedOut: true }>> {
  try {
    requireSupabaseConfigured();
    const supabase = await createSupabaseServerActionClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    await supabase.auth.signOut();

    if (accessToken && isDatabaseConfigured()) {
      const tokenHash = await sha256Hex(accessToken);
      await prisma.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const cookieStore = await cookies();
    cookieStore.delete(ACTIVE_ORG_COOKIE);
    cookieStore.delete(REMEMBER_ME_COOKIE);

    await writeAuditLog({
      actorUserId: meta.userId,
      action: "session.revoked",
      resourceType: "session",
      ip: meta.ip,
      metadata: { scope: "current" },
    });

    return apiSuccess({ signedOut: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("SIGNOUT_FAILED", "Sign out failed");
  }
}

export async function requestPasswordReset(
  raw: { email: string },
  meta: { ip?: string | null },
): Promise<ApiResponse<{ sent: true }>> {
  try {
    const input = forgotPasswordSchema.parse(raw);
    await enforceAuthRateLimit(`reset:${meta.ip ?? input.email}`);

    try {
      await AuthService.requestPinReset(input.email, meta.ip ?? undefined);
    } catch {
      // Enumeration-safe: leftover password-reset action must not leak account existence.
    }

    await writeAuditLog({
      action: "password.reset_requested",
      resourceType: "auth",
      ip: meta.ip,
      metadata: { email: input.email, recovery: "pin_reset" },
    });

    return apiSuccess({ sent: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiSuccess({ sent: true });
  }
}

export async function updatePassword(
  _raw: { password: string },
  _meta: { userId?: string | null; ip?: string | null },
): Promise<ApiResponse<{ updated: true }>> {
  return apiError(
    "PASSWORD_UPDATE_FAILED",
    "PIN recovery is at /forgot-pin. Password update is not used for Zolanzo accounts.",
  );
}

export async function resendVerificationEmail(
  meta: { ip?: string | null } = {},
): Promise<ApiResponse<{ sent: true }>> {
  try {
    requireSupabaseConfigured();
    const supabase = await createSupabaseServerActionClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) {
      throw new AppError("UNAUTHENTICATED", "No authenticated user", 401);
    }

    await enforceAuthRateLimit(`verify:${meta.ip ?? data.user.email}`);
    await AuthService.resendEmailVerification(
      data.user.email,
      meta.ip ?? undefined,
    );

    return apiSuccess({ sent: true });
  } catch (error) {
    if (error instanceof AppError) return error.toApiError();
    return apiError("VERIFY_RESEND_FAILED", "Could not resend verification");
  }
}

export { generateOpaqueToken };
