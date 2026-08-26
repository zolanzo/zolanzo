import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatStoredPin, verifyStoredPin } from "@/lib/security/hash";
import { sendEmailOtp, sendPinResetEmail } from "@/lib/email/resend";
import { APP_CONFIG } from "@/config/app";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";
import { provisionAuthenticatedUser, emitAuthWelcome } from "@/features/authentication/services/provisioning";
import { prisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/api/response";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import {
  EMAIL_OTP_PURPOSE,
  EMAIL_OTP_USER_MESSAGES,
  consumeEmailOtp,
  deleteEmailOtp,
  findMatchingConsumedEmailOtp,
  findPinResetGrant,
  issueEmailOtp,
  messageForOtpFailure,
  type EmailOtpPurpose,
} from "@/lib/auth/email-otp";
import { findAuthUserByEmail, isAlreadyRegisteredError } from "@/lib/auth/auth-users";
import { withKeyedLock } from "@/lib/auth/keyed-lock";
import { logger } from "@/lib/observability/logger";

export interface SignupInput {
  role?: "worker" | "employer";
  fullName: string;
  email: string;
  pin: string;
  referralCode?: string;
}

export interface LoginInput {
  email: string;
  pin: string;
  rememberMe?: boolean;
}

export interface VerificationInput {
  email: string;
  code: string;
}

export interface PhoneVerificationInput {
  userId: string;
  phone: string;
  code: string;
}

type PinProfileRow = {
  id: string;
  email?: string | null;
  role?: string | null;
  pin_hash?: string | null;
  email_verified?: boolean | null;
  status?: string | null;
  onboarding_completed?: boolean | null;
  full_name?: string | null;
};

function authPasswordFromPin(pin: string): string {
  return `${pin}_ZOLANZO_SECURE_KEY`;
}

function userFacingError(err: unknown, fallback: string): Error {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      return new Error("Authentication service is unreachable. Please try again shortly.");
    }
    return new Error(err.message);
  }
  if (err instanceof Error && err.message) {
    return err;
  }
  return new Error(fallback);
}

/**
 * Main ZOLANZO Authentication Backend Service
 */
export class AuthService {
  static generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "ZOL";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async registerUser(input: SignupInput, ipAddress?: string, userAgent?: string) {
    if (!input.role) {
      throw new Error("Account creation requires an explicit role selection ('worker' or 'employer').");
    }
    if (!isValidEmail(input.email)) {
      throw new Error("Please enter a valid email address.");
    }

    const role = input.role;
    const email = normalizeEmail(input.email);
    const fullName = input.fullName.trim();
    const pinHash = formatStoredPin(input.pin);
    const password = authPasswordFromPin(input.pin);

    return withKeyedLock(`register:${email}`, async () => {
    try {
      const admin = createSupabaseAdminClient();
      let userId: string | null = null;

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          role,
        },
        app_metadata: {
          roles: [role],
        },
      });

      if (createError || !created.user) {
        if (isAlreadyRegisteredError(createError?.message)) {
          const existing = await findAuthUserByEmail(email);
          if (!existing) {
            throw new Error("An account with this email already exists. Please log in.");
          }
          const existingProfile = await this.getProfileByEmail(email);
          if (existing.email_confirmed_at || existingProfile?.email_verified) {
            throw new Error("An account with this email already exists. Please log in.");
          }
          userId = existing.id;
          await admin.auth.admin.updateUserById(userId, {
            password,
            email_confirm: false,
            user_metadata: {
              full_name: fullName,
              role,
            },
            app_metadata: {
              roles: [role],
            },
          });
        } else {
          throw new Error("Registration could not be completed. Please try again.");
        }
      } else {
        userId = created.user.id;
      }

      if (!userId) {
        throw new Error("Failed to create user account.");
      }

      try {
        await provisionAuthenticatedUser({
          authSubject: userId,
          email,
          displayName: fullName,
          emailVerified: false,
          ip: ipAddress,
          useAuthSubjectAsId: true,
          skipWelcome: true,
          participation: role === "employer" ? "client" : "worker",
          roleKeys: role === "employer" ? ["client"] : ["worker"],
        });
      } catch (provisionError) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { authSubject: true },
        });
        if (!existingUser || existingUser.authSubject !== userId) {
          throw provisionError;
        }
      }

      let referrerId: string | null = null;
      if (input.referralCode?.trim()) {
        const referralCode = input.referralCode.trim().toUpperCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: refProfile } = await (admin.from("profiles") as any)
          .select("id")
          .eq("referral_code", referralCode)
          .maybeSingle();
        if (refProfile?.id) {
          referrerId = refProfile.id;
        }
      }

      const userReferralCode = this.generateReferralCode();
      await this.patchPinProfile(admin, {
        userId,
        fullName,
        email,
        role,
        pinHash,
        emailVerified: false,
        referralCode: userReferralCode,
        referrerId,
      });

      if (referrerId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: referralError } = await (admin.from("referrals") as any).insert({
          referrer_id: referrerId,
          referred_id: userId,
          referral_code: input.referralCode!.trim().toUpperCase(),
        });
        if (referralError && !/duplicate|unique/i.test(referralError.message ?? "")) {
          // Non-unique referral failures are non-blocking for account creation.
        }
      }

      await this.dispatchEmailOtp({
        userId,
        email,
        fullName,
        purpose: EMAIL_OTP_PURPOSE.emailVerification,
      });

      await this.logAuditEvent(userId, "signup", ipAddress, userAgent);
      return { userId, email };
    } catch (err) {
      throw userFacingError(err, "Registration could not be completed. Please try again.");
    }
    });
  }

  static async getProfileByEmail(email: string): Promise<PinProfileRow | null> {
    const admin = createSupabaseAdminClient();
    const normalized = normalizeEmail(email);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from("profiles") as any)
      .select("*")
      .eq("email", normalized)
      .limit(1)
      .maybeSingle();
    if (error && isBackendUnavailableError(error)) {
      throw new Error("Authentication service is unreachable. Please try again shortly.");
    }
    return (data as PinProfileRow | null) ?? null;
  }

  static async verifyEmail(
    email: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
    purpose: EmailOtpPurpose = EMAIL_OTP_PURPOSE.emailVerification,
  ) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized) || String(code ?? "").replace(/\D/g, "").length !== 6) {
      throw new Error("Email and 6-digit verification code are required.");
    }

    try {
      return await withKeyedLock(`verify:${normalized}:${purpose}`, async () => {
        if (purpose === EMAIL_OTP_PURPOSE.emailVerification) {
          const profile = await this.getProfileByEmail(normalized);
          if (profile?.email_verified) {
            throw new Error(EMAIL_OTP_USER_MESSAGES.alreadyVerified);
          }
        }

        let result = await consumeEmailOtp({
          email: normalized,
          code,
          purpose,
        });

        if (!result.ok) {
          if (
            result.reason === "already_used" &&
            purpose === EMAIL_OTP_PURPOSE.emailVerification
          ) {
            const matched = await findMatchingConsumedEmailOtp({
              email: normalized,
              code,
              purpose,
            });
            const profileAfter = await this.getProfileByEmail(normalized);
            if (matched?.verified_at && !profileAfter?.email_verified) {
              result = { ok: true, id: matched.id, userId: matched.user_id };
            }
          }
          if (!result.ok) {
            throw new Error(messageForOtpFailure(result.reason));
          }
        }

        if (purpose === EMAIL_OTP_PURPOSE.pinReset) {
          return { success: true, purpose };
        }

        const admin = createSupabaseAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: profileError } = await (admin.from("profiles") as any)
          .update({ email_verified: true })
          .eq("id", result.userId);
        if (profileError) {
          throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
        }

        const { error: confirmError } = await admin.auth.admin.updateUserById(result.userId, {
          email_confirm: true,
        });
        if (confirmError) {
          throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
        }

        await prisma.user.updateMany({
          where: { authSubject: result.userId },
          data: { emailVerifiedAt: new Date() },
        });

        await this.logAuditEvent(result.userId, "email_verification", ipAddress, userAgent);
        await this.emitWelcomeAfterEmailVerification({
          userId: result.userId,
          email: normalized,
        });
        return { success: true, purpose };
      });
    } catch (err) {
      throw userFacingError(err, EMAIL_OTP_USER_MESSAGES.generic);
    }
  }

  static async resendEmailVerification(
    email: string,
    ipAddress?: string,
    userAgent?: string,
    purpose: EmailOtpPurpose = EMAIL_OTP_PURPOSE.emailVerification,
  ) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error("Please enter a valid email address.");
    }

    try {
      const profile = await this.getProfileByEmail(normalized);
      if (purpose === EMAIL_OTP_PURPOSE.emailVerification && profile?.email_verified) {
        throw new Error(EMAIL_OTP_USER_MESSAGES.alreadyVerified);
      }
      if (!profile?.id) {
        throw new Error(EMAIL_OTP_USER_MESSAGES.noActive);
      }

      await this.dispatchEmailOtp({
        userId: profile.id,
        email: normalized,
        fullName: profile.full_name || "User",
        purpose,
      });
      await this.logAuditEvent(profile.id, "email_verification_resend", ipAddress, userAgent);
      return { success: true, email: normalized };
    } catch (err) {
      throw userFacingError(err, EMAIL_OTP_USER_MESSAGES.sendFailed);
    }
  }

  /**
   * Phone OTP is owned by features/authentication/services/phone-verification.ts
   * (Sendchamp create/confirm). This method must not silently mark verified.
   */
  static async sendPhoneOtp(_userId: string, _phone: string): Promise<never> {
    throw new Error("Unable to send verification code. Please try again.");
  }

  /**
   * Authenticate user via Email + 6-digit PIN
   */
  static async loginUser(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const email = normalizeEmail(input.email);
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    try {
      const profile = await this.getProfileByEmail(email);
      if (!profile) {
        await this.logAuditEvent(null, "failed_login", ipAddress, userAgent, { email });
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      if (!profile.role) {
        throw new Error("User profile role is missing. Please contact platform support.");
      }

      const isPinValid = verifyStoredPin(input.pin, profile.pin_hash ?? "");
      if (!isPinValid) {
        await this.logAuditEvent(profile.id, "failed_login", ipAddress, userAgent);
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      await admin.auth.admin.updateUserById(profile.id, {
        app_metadata: { roles: [profile.role] },
        user_metadata: { role: profile.role },
      });

      if (profile.status && profile.status !== "active") {
        throw new Error(
          `Your account is currently inactive or suspended. Please contact support on WhatsApp at ${APP_CONFIG.supportWhatsApp.display}.`,
        );
      }

      if (!profile.email_verified) {
        return { requiresEmailVerification: true, email: normalizeEmail(profile.email || email) };
      }

      if (!supabase) {
        throw new Error("Authentication service is unreachable. Please try again shortly.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: authPasswordFromPin(input.pin),
      });
      if (signInError && /not confirmed|email not confirmed/i.test(signInError.message)) {
        return { requiresEmailVerification: true, email };
      }
      if (signInError) {
        if (isBackendUnavailableError(signInError)) {
          throw new Error("Authentication service is unreachable. Please try again shortly.");
        }
        await this.logAuditEvent(profile.id, "failed_login", ipAddress, userAgent);
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      const role = profile.role.toLowerCase();
      let redirectUrl = "";

      if (role === "admin" || role === "super_admin") {
        redirectUrl = "/lex/auth";
      } else if (role === "staff") {
        redirectUrl = "/lex/staff";
      } else if (role === "employer" || role === "hirer") {
        redirectUrl = profile.onboarding_completed ? "/hirer/dashboard" : "/onboarding";
      } else if (role === "worker" || role === "earner") {
        redirectUrl = profile.onboarding_completed ? "/earner/dashboard" : "/onboarding";
      } else {
        throw new Error(`Unrecognized user role '${role}' during login redirect calculation.`);
      }

      await this.logAuditEvent(profile.id, "login", ipAddress, userAgent);
      return { success: true, profile, redirectUrl };
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        throw new Error("Authentication service is unreachable. Please try again shortly.");
      }
      throw userFacingError(err, "Invalid credentials. Please verify your email and PIN.");
    }
  }

  static async requestPinReset(email: string, ipAddress?: string, userAgent?: string) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error("Please enter a valid email address.");
    }

    try {
      const profile = await this.getProfileByEmail(normalized);
      if (profile?.id) {
        try {
          await this.dispatchEmailOtp({
            userId: profile.id,
            email: normalized,
            fullName: profile.full_name || "User",
            purpose: EMAIL_OTP_PURPOSE.pinReset,
          });
          await this.logAuditEvent(profile.id, "pin_reset_requested", ipAddress, userAgent);
        } catch (sendError) {
          logger.warn("PIN reset email dispatch failed", {
            span: "auth.pin_reset",
            message: sendError instanceof Error ? sendError.message : "send_failed",
          });
        }
      }
      return { success: true };
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        throw new Error("Authentication service is unreachable. Please try again shortly.");
      }
      return { success: true };
    }
  }

  static async resetPin(email: string, newPin: string, ipAddress?: string, userAgent?: string) {
    const normalized = normalizeEmail(email);
    if (!/^\d{6}$/.test(newPin)) {
      throw new Error("PIN must consist of exactly 6 numeric digits.");
    }

    try {
      const grant = await findPinResetGrant(normalized);
      if (!grant) {
        throw new Error("No active PIN reset request found. Please request a new code.");
      }

      const admin = createSupabaseAdminClient();
      const newPinHash = formatStoredPin(newPin);
      const profile = await this.getProfileByEmail(normalized);
      if (!profile?.id) {
        throw new Error("No active PIN reset request found. Please request a new code.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profiles = admin.from("profiles") as any;
      const { data: updated, error: updateError } = await profiles
        .update({ pin_hash: newPinHash })
        .eq("id", profile.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        throw new Error("PIN reset failed.");
      }

      if (!updated) {
        const { data: updatedByUserId, error: byUserIdError } = await profiles
          .update({ pin_hash: newPinHash })
          .eq("user_id", profile.id)
          .select("id")
          .maybeSingle();
        if (byUserIdError || !updatedByUserId) {
          throw new Error("PIN reset failed.");
        }
      }

      const { error: passwordError } = await admin.auth.admin.updateUserById(profile.id, {
        password: authPasswordFromPin(newPin),
      });
      if (passwordError) {
        throw new Error("PIN reset failed.");
      }

      await this.logAuditEvent(profile.id, "pin_reset_completed", ipAddress, userAgent);
      await deleteEmailOtp(grant.id);
      return { success: true };
    } catch (err) {
      throw userFacingError(err, "PIN reset failed.");
    }
  }

  private static async emitWelcomeAfterEmailVerification(params: {
    userId: string;
    email: string;
  }) {
    try {
      const user = await prisma.user.findFirst({
        where: { OR: [{ id: params.userId }, { authSubject: params.userId }] },
        select: { id: true, activeOrganizationId: true },
      });
      if (!user) return;

      const organizationId =
        user.activeOrganizationId ??
        (
          await prisma.organizationMember.findFirst({
            where: { userId: user.id },
            select: { organizationId: true },
          })
        )?.organizationId;
      if (!organizationId) return;

      const profile = await this.getProfileByEmail(params.email);
      const prismaProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { displayName: true },
      });
      await emitAuthWelcome({
        userId: user.id,
        organizationId,
        email: params.email,
        displayName: profile?.full_name || prismaProfile?.displayName || "there",
        channels: ["email", "in_app"],
        dispatchNow: true,
      });
    } catch {
      // Welcome mail must never fail email verification.
    }
  }

  static async logAuditEvent(
    userId: string | null,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ) {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("audit_logs") as any).insert({
        user_id: userId,
        action,
        ip_address: ipAddress || "127.0.0.1",
        user_agent: userAgent || "",
        metadata: metadata || {},
      });
    } catch {
      // Audit must never block auth.
    }
  }

  private static async dispatchEmailOtp(params: {
    userId: string;
    email: string;
    fullName: string;
    purpose: EmailOtpPurpose;
  }) {
    const otp = await issueEmailOtp({
      userId: params.userId,
      email: params.email,
      purpose: params.purpose,
    });

    const sent =
      params.purpose === EMAIL_OTP_PURPOSE.pinReset
        ? await sendPinResetEmail(params.email, otp, params.fullName)
        : await sendEmailOtp(params.email, otp, params.fullName);

    if (!sent.success) {
      throw new Error(EMAIL_OTP_USER_MESSAGES.sendFailed);
    }
  }

  private static async patchPinProfile(
    admin: ReturnType<typeof createSupabaseAdminClient>,
    params: {
      userId: string;
      fullName: string;
      email: string;
      role: "worker" | "employer";
      pinHash: string;
      emailVerified: boolean;
      referralCode: string;
      referrerId: string | null;
    },
  ) {
    const now = new Date().toISOString();
    const patch = {
      full_name: params.fullName,
      display_name: params.fullName,
      email: params.email,
      role: params.role,
      pin_hash: params.pinHash,
      email_verified: params.emailVerified,
      phone_verified: false,
      referral_code: params.referralCode,
      referred_by: params.referrerId,
      status: "active",
      onboarding_completed: false,
      first_login_completed: false,
      updated_at: now,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles = admin.from("profiles") as any;
    const { error } = await profiles.upsert(
      {
        id: params.userId,
        user_id: params.userId,
        ...patch,
        created_at: now,
      },
      { onConflict: "id" },
    );

    if (error) {
      throw new Error("Registration could not be completed. Please try again.");
    }
  }
}
