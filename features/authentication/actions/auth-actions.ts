"use server";

import type { ApiResponse } from "@/lib/api/response";
import {
  signInWithEmail,
  signOutCurrent,
  signUpWithEmail,
  requestPasswordReset,
  updatePassword,
  resendVerificationEmail,
} from "@/features/authentication/services/auth-service";
import {
  revokeAllSessions,
  revokeSession,
} from "@/features/authentication/services/session-service";
import {
  getRequestIp,
  getRequestUserAgent,
  requireAuthContext,
} from "@/lib/auth/session";
import { createSupabaseServerActionClient } from "@/lib/supabase/server-action";

export async function signUpAction(input: {
  email: string;
  password: string;
  displayName: string;
  rememberMe?: boolean;
}): Promise<ApiResponse<{ needsEmailVerification: boolean }>> {
  return signUpWithEmail(
    {
      ...input,
      rememberMe: input.rememberMe ?? false,
    },
    {
      ip: await getRequestIp(),
      userAgent: await getRequestUserAgent(),
    },
  );
}

export async function signInAction(input: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<ApiResponse<{ userId: string }>> {
  return signInWithEmail(
    {
      ...input,
      rememberMe: input.rememberMe ?? false,
    },
    {
      ip: await getRequestIp(),
      userAgent: await getRequestUserAgent(),
    },
  );
}

export async function signOutAction(): Promise<
  ApiResponse<{ signedOut: true }>
> {
  const ctx = await requireAuthContext().catch(() => null);
  return signOutCurrent({
    userId: ctx?.user.id,
    ip: await getRequestIp(),
  });
}

export async function forgotPasswordAction(input: {
  email: string;
}): Promise<ApiResponse<{ sent: true }>> {
  return requestPasswordReset(input, { ip: await getRequestIp() });
}

export async function updatePasswordAction(input: {
  password: string;
}): Promise<ApiResponse<{ updated: true }>> {
  const ctx = await requireAuthContext().catch(() => null);
  return updatePassword(input, {
    userId: ctx?.user.id,
    ip: await getRequestIp(),
  });
}

export async function resendVerificationAction(): Promise<
  ApiResponse<{ sent: true }>
> {
  return resendVerificationEmail({ ip: await getRequestIp() });
}

export async function revokeSessionAction(
  sessionId: string,
): Promise<ApiResponse<{ revoked: true }>> {
  const ctx = await requireAuthContext();
  return revokeSession(ctx.user.id, sessionId);
}

export async function revokeAllSessionsAction(): Promise<
  ApiResponse<{ revoked: number }>
> {
  const ctx = await requireAuthContext();
  const supabase = await createSupabaseServerActionClient();
  const { data } = await supabase.auth.getSession();
  return revokeAllSessions(ctx.user.id, data.session?.access_token);
}
