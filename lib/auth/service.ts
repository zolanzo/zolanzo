import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmailOtp, sendPinResetEmail } from "@/lib/email/resend";
import { APP_CONFIG } from "@/config/app";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";
import {
  provisionAuthenticatedUser,
  emitAuthWelcome,
} from "@/features/authentication/services/provisioning";
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
import { writeAuditLog } from "@/lib/audit/write";
import {
  isOnboardingComplete,
  jwtAppMetadataRoles,
  productRoleFromRbac,
  signupRoleToParticipation,
  signupRoleToRoleKeys,
  type ProductRole,
  type SignupProductRole,
} from "@/lib/auth/product-identity";
import { authPasswordFromPin } from "@/lib/auth/pin-credentials";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface SignupInput {
  role?: SignupProductRole;
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

export type AuthSessionProfile = {
  id: string;
  email: string | null;
  role: ProductRole;
  onboarding_completed: boolean;
  displayName: string | null;
};

type ApplicationUser = {
  id: string;
  authSubject: string | null;
  email: string | null;
  emailVerifiedAt: Date | null;
  status: string;
  participation: "worker" | "client" | "both" | null;
  displayName: string | null;
  countryCode: string | null;
  addressJson: unknown;
  roleKeys: string[];
  productRole: ProductRole;
  onboardingCompleted: boolean;
  activeOrganizationId: string | null;
};

function userFacingError(err: unknown, fallback: string): Error {
  if (err instanceof AppError) {
    return new Error(err.message);
  }
  if (err instanceof Error && err.message) {
    return err;
  }
  return new Error(fallback);
}

function toSessionProfile(user: ApplicationUser): AuthSessionProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.productRole,
    onboarding_completed: user.onboardingCompleted,
    displayName: user.displayName,
  };
}

function auditMetadata(
  value: Record<string, unknown>,
): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/**
 * Main ZOLANZO Authentication Backend Service
 */
export class AuthService {
  static async registerUser(
    input: SignupInput,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!input.role) {
      throw new Error(
        "Account creation requires an explicit role selection ('worker' or 'employer').",
      );
    }
    if (!isValidEmail(input.email)) {
      throw new Error("Please enter a valid email address.");
    }

    const role = input.role;
    const email = normalizeEmail(input.email);
    const fullName = input.fullName.trim();
    const password = authPasswordFromPin(input.pin);

    return withKeyedLock(`register:${email}`, async () => {
      try {
        const admin = createSupabaseAdminClient();
        let userId: string | null = null;

        const { data: created, error: createError } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: {
              full_name: fullName,
            },
            app_metadata: {
              roles: jwtAppMetadataRoles(role),
            },
          });

        if (createError || !created.user) {
          if (isAlreadyRegisteredError(createError?.message)) {
            const existing = await findAuthUserByEmail(email);
            if (!existing) {
              throw new Error(
                "An account with this email already exists. Please log in.",
              );
            }
            const existingUser = await this.loadApplicationUserByEmail(email);
            if (existing.email_confirmed_at || existingUser?.emailVerifiedAt) {
              throw new Error(
                "An account with this email already exists. Please log in.",
              );
            }
            userId = existing.id;
            await admin.auth.admin.updateUserById(userId, {
              password,
              email_confirm: false,
              user_metadata: {
                full_name: fullName,
              },
              app_metadata: {
                roles: jwtAppMetadataRoles(role),
              },
            });
          } else {
            throw new Error(
              "Registration could not be completed. Please try again.",
            );
          }
        } else {
          userId = created.user.id;
        }

        if (!userId) {
          throw new Error("Failed to create user account.");
        }

        const provisioned = await provisionAuthenticatedUser({
          authSubject: userId,
          email,
          displayName: fullName,
          emailVerified: false,
          ip: ipAddress,
          useAuthSubjectAsId: true,
          skipWelcome: true,
          participation: signupRoleToParticipation(role),
          roleKeys: signupRoleToRoleKeys(role),
        });

        await admin.auth.admin.updateUserById(userId, {
          app_metadata: {
            platform_user_id: provisioned.userId,
            roles: jwtAppMetadataRoles(role),
            active_organization_id: provisioned.organizationId,
          },
        });

        await this.dispatchEmailOtp({
          userId,
          email,
          fullName,
          purpose: EMAIL_OTP_PURPOSE.emailVerification,
        });

        await writeAuditLog({
          actorUserId: provisioned.userId,
          action: "auth.signup",
          resourceType: "user",
          resourceId: provisioned.userId,
          organizationId: provisioned.organizationId,
          ip: ipAddress,
          metadata: auditMetadata({
            userAgent: userAgent ?? "",
            referralAccepted: Boolean(input.referralCode?.trim()),
          }),
        });
        return { userId, email };
      } catch (err) {
        throw userFacingError(
          err,
          "Registration could not be completed. Please try again.",
        );
      }
    });
  }

  static async verifyEmail(
    email: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
    purpose: EmailOtpPurpose = EMAIL_OTP_PURPOSE.emailVerification,
  ) {
    const normalized = normalizeEmail(email);
    if (
      !isValidEmail(normalized) ||
      String(code ?? "").replace(/\D/g, "").length !== 6
    ) {
      throw new Error("Email and 6-digit verification code are required.");
    }

    try {
      return await withKeyedLock(
        `verify:${normalized}:${purpose}`,
        async () => {
          if (purpose === EMAIL_OTP_PURPOSE.emailVerification) {
            const user = await this.loadApplicationUserByEmail(normalized);
            if (user?.emailVerifiedAt) {
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
              const userAfter =
                await this.loadApplicationUserByEmail(normalized);
              if (matched?.verified_at && !userAfter?.emailVerifiedAt) {
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
          const { error: confirmError } = await admin.auth.admin.updateUserById(
            result.userId,
            { email_confirm: true },
          );
          if (confirmError) {
            throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
          }

          await prisma.user.updateMany({
            where: { authSubject: result.userId },
            data: { emailVerifiedAt: new Date() },
          });

          const appUser = await this.loadApplicationUserByAuthSubject(
            result.userId,
          );
          await writeAuditLog({
            actorUserId: appUser?.id ?? null,
            action: "auth.email_verified",
            resourceType: "user",
            resourceId: appUser?.id ?? result.userId,
            ip: ipAddress,
            metadata: auditMetadata({ userAgent: userAgent ?? "" }),
          });
          await this.emitWelcomeAfterEmailVerification({
            userId: result.userId,
            email: normalized,
          });
          return { success: true, purpose };
        },
      );
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
      const user = await this.loadApplicationUserByEmail(normalized);
      const authUser = await findAuthUserByEmail(normalized);
      if (purpose === EMAIL_OTP_PURPOSE.emailVerification && user?.emailVerifiedAt) {
        throw new Error(EMAIL_OTP_USER_MESSAGES.alreadyVerified);
      }
      if (!authUser) {
        throw new Error(EMAIL_OTP_USER_MESSAGES.generic);
      }

      await this.dispatchEmailOtp({
        userId: authUser.id,
        email: normalized,
        fullName: user?.displayName || "User",
        purpose,
      });

      await writeAuditLog({
        actorUserId: user?.id ?? null,
        action: "auth.email_verification_resend",
        resourceType: "user",
        resourceId: user?.id ?? authUser.id,
        ip: ipAddress,
        metadata: auditMetadata({
          userAgent: userAgent ?? "",
          purpose,
        }),
      });
      return { success: true };
    } catch (err) {
      throw userFacingError(err, EMAIL_OTP_USER_MESSAGES.sendFailed);
    }
  }

  /**
   * Phone OTP is owned by features/authentication/services/phone-verification.ts
   */
  static async sendPhoneOtp(_userId: string, _phone: string): Promise<never> {
    throw new Error("Unable to send verification code. Please try again.");
  }

  static async loginUser(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const email = normalizeEmail(input.email);
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();

    try {
      if (!supabase) {
        throw new Error(
          "Authentication service is unreachable. Please try again shortly.",
        );
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: authPasswordFromPin(input.pin),
        });

      if (signInError && /not confirmed|email not confirmed/i.test(signInError.message)) {
        return { requiresEmailVerification: true, email };
      }
      if (signInError || !signInData.user) {
        if (isBackendUnavailableError(signInError)) {
          throw new Error(
            "Authentication service is unreachable. Please try again shortly.",
          );
        }
        await writeAuditLog({
          action: "auth.login_failed",
          resourceType: "auth",
          ip: ipAddress,
          metadata: auditMetadata({ email }),
        });
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      let appUser = await this.loadApplicationUserByAuthSubject(
        signInData.user.id,
      );
      if (!appUser) {
        appUser = await this.loadApplicationUserByEmail(email);
      }

      if (!appUser) {
        const displayName =
          (typeof signInData.user.user_metadata?.full_name === "string" &&
            signInData.user.user_metadata.full_name) ||
          email.split("@")[0] ||
          "User";
        const jwtRoles = signInData.user.app_metadata?.roles;
        const signupRole: SignupProductRole =
          Array.isArray(jwtRoles) && jwtRoles[0] === "employer"
            ? "employer"
            : "worker";
        await provisionAuthenticatedUser({
          authSubject: signInData.user.id,
          email,
          displayName,
          emailVerified: Boolean(signInData.user.email_confirmed_at),
          ip: ipAddress,
          useAuthSubjectAsId: true,
          skipWelcome: true,
          participation: signupRoleToParticipation(signupRole),
          roleKeys: signupRoleToRoleKeys(signupRole),
        });
        appUser = await this.loadApplicationUserByAuthSubject(
          signInData.user.id,
        );
      }

      if (!appUser) {
        throw new Error(
          "Authentication service is unreachable. Please try again shortly.",
        );
      }

      if (appUser.status !== "active") {
        throw new Error(
          `Your account is currently inactive or suspended. Please contact support on WhatsApp at ${APP_CONFIG.supportWhatsApp.display}.`,
        );
      }

      if (!appUser.emailVerifiedAt && !signInData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return { requiresEmailVerification: true, email };
      }

      await admin.auth.admin.updateUserById(signInData.user.id, {
        app_metadata: {
          platform_user_id: appUser.id,
          roles: jwtAppMetadataRoles(appUser.productRole),
          active_organization_id: appUser.activeOrganizationId,
        },
      });

      const role = appUser.productRole;
      let redirectUrl = "";
      if (role === "admin" || role === "super_admin") {
        redirectUrl = "/lex/auth";
      } else if (role === "staff") {
        redirectUrl = "/lex/staff";
      } else if (role === "employer") {
        redirectUrl = appUser.onboardingCompleted
          ? "/hirer/dashboard"
          : "/onboarding";
      } else if (role === "worker") {
        redirectUrl = appUser.onboardingCompleted
          ? "/earner/dashboard"
          : "/onboarding";
      } else {
        throw new Error(
          `Unrecognized user role '${role}' during login redirect calculation.`,
        );
      }

      await writeAuditLog({
        actorUserId: appUser.id,
        action: "auth.login",
        resourceType: "session",
        resourceId: appUser.id,
        ip: ipAddress,
        metadata: auditMetadata({ userAgent: userAgent ?? "" }),
      });
      return {
        success: true,
        profile: toSessionProfile(appUser),
        redirectUrl,
      };
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        throw new Error(
          "Authentication service is unreachable. Please try again shortly.",
        );
      }
      throw userFacingError(
        err,
        "Invalid credentials. Please verify your email and PIN.",
      );
    }
  }

  static async requestPinReset(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      throw new Error("Please enter a valid email address.");
    }

    try {
      const authUser = await findAuthUserByEmail(normalized);
      const appUser = await this.loadApplicationUserByEmail(normalized);
      if (authUser?.id) {
        try {
          await this.dispatchEmailOtp({
            userId: authUser.id,
            email: normalized,
            fullName: appUser?.displayName || "User",
            purpose: EMAIL_OTP_PURPOSE.pinReset,
          });
          await writeAuditLog({
            actorUserId: appUser?.id ?? null,
            action: "auth.pin_reset_requested",
            resourceType: "user",
            resourceId: appUser?.id ?? authUser.id,
            ip: ipAddress,
            metadata: auditMetadata({ userAgent: userAgent ?? "" }),
          });
        } catch (sendError) {
          logger.warn("PIN reset email dispatch failed", {
            span: "auth.pin_reset",
            message:
              sendError instanceof Error ? sendError.message : "send_failed",
          });
        }
      }
      return { success: true };
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        throw new Error(
          "Authentication service is unreachable. Please try again shortly.",
        );
      }
      return { success: true };
    }
  }

  static async resetPin(
    email: string,
    newPin: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const normalized = normalizeEmail(email);
    if (!/^\d{6}$/.test(newPin)) {
      throw new Error("PIN must consist of exactly 6 numeric digits.");
    }

    try {
      const grant = await findPinResetGrant(normalized);
      if (!grant) {
        throw new Error(
          "No active PIN reset request found. Please request a new code.",
        );
      }

      const admin = createSupabaseAdminClient();
      const appUser = await this.loadApplicationUserByEmail(normalized);
      const authUser =
        (await findAuthUserByEmail(normalized)) ??
        (appUser?.authSubject
          ? { id: appUser.authSubject }
          : null);
      if (!authUser?.id) {
        throw new Error(
          "No active PIN reset request found. Please request a new code.",
        );
      }

      const { error: passwordError } = await admin.auth.admin.updateUserById(
        authUser.id,
        { password: authPasswordFromPin(newPin) },
      );
      if (passwordError) {
        throw new Error("PIN reset failed.");
      }

      await writeAuditLog({
        actorUserId: appUser?.id ?? null,
        action: "auth.pin_reset_completed",
        resourceType: "user",
        resourceId: appUser?.id ?? authUser.id,
        ip: ipAddress,
        metadata: auditMetadata({ userAgent: userAgent ?? "" }),
      });
      await deleteEmailOtp(grant.id);
      return { success: true };
    } catch (err) {
      throw userFacingError(err, "PIN reset failed.");
    }
  }

  private static async loadApplicationUserByEmail(
    email: string,
  ): Promise<ApplicationUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      include: {
        profile: {
          select: {
            displayName: true,
            countryCode: true,
            addressJson: true,
          },
        },
        roles: { include: { role: { select: { key: true } } } },
      },
    });
    return user ? this.toApplicationUser(user) : null;
  }

  private static async loadApplicationUserByAuthSubject(
    authSubject: string,
  ): Promise<ApplicationUser | null> {
    const user = await prisma.user.findFirst({
      where: { OR: [{ authSubject }, { id: authSubject }] },
      include: {
        profile: {
          select: {
            displayName: true,
            countryCode: true,
            addressJson: true,
          },
        },
        roles: { include: { role: { select: { key: true } } } },
      },
    });
    return user ? this.toApplicationUser(user) : null;
  }

  private static toApplicationUser(user: {
    id: string;
    authSubject: string | null;
    email: string | null;
    emailVerifiedAt: Date | null;
    status: string;
    participation: "worker" | "client" | "both" | null;
    activeOrganizationId: string | null;
    profile: {
      displayName: string;
      countryCode: string | null;
      addressJson: unknown;
    } | null;
    roles: { role: { key: string } }[];
  }): ApplicationUser {
    const roleKeys = user.roles.map((row) => row.role.key);
    return {
      id: user.id,
      authSubject: user.authSubject,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
      status: user.status,
      participation: user.participation,
      displayName: user.profile?.displayName ?? null,
      countryCode: user.profile?.countryCode ?? null,
      addressJson: user.profile?.addressJson ?? null,
      roleKeys,
      productRole: productRoleFromRbac({
        participation: user.participation,
        roleKeys,
      }),
      onboardingCompleted: isOnboardingComplete({
        countryCode: user.profile?.countryCode ?? null,
        addressJson: user.profile?.addressJson ?? null,
      }),
      activeOrganizationId: user.activeOrganizationId,
    };
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

      const prismaProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { displayName: true },
      });
      await emitAuthWelcome({
        userId: user.id,
        organizationId,
        email: params.email,
        displayName: prismaProfile?.displayName || "there",
        channels: ["email", "in_app"],
        dispatchNow: true,
      });
    } catch {
      // Welcome mail must never fail email verification.
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
}
