import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatStoredPin, verifyStoredPin } from "@/lib/security/hash";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "@/lib/otp/generator";
import { sendEmailOtp, sendPinResetEmail } from "@/lib/email/resend";
import { APP_CONFIG } from "@/config/app";
import { isBackendUnavailableError } from "@/lib/reliability/backend-unavailable";

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

    const supabase = await createSupabaseServerClient();
    const pinHash = formatStoredPin(input.pin);
    const userReferralCode = this.generateReferralCode();

    if (supabase) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.pin + "_ZOLANZO_SECURE_KEY",
        options: {
          data: {
            full_name: input.fullName,
            role: input.role,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error("Failed to create user account.");
      }

      let referrerId: string | null = null;
      if (input.referralCode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: refProfile } = await (supabase.from("profiles") as any)
          .select("id")
          .eq("referral_code", input.referralCode.trim().toUpperCase())
          .single();
        if (refProfile) {
          referrerId = refProfile.id;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any).insert({
        id: userId,
        full_name: input.fullName,
        email: input.email,
        role: input.role,
        pin_hash: pinHash,
        email_verified: false,
        phone_verified: false,
        referral_code: userReferralCode,
        referred_by: referrerId,
        status: "active",
      });

      if (referrerId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("referrals") as any).insert({
          referrer_id: referrerId,
          referred_id: userId,
          referral_code: input.referralCode!.trim().toUpperCase(),
        });
      }

      const otp = generateOtpCode(6);
      const codeHash = hashOtpCode(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("email_verifications") as any).insert({
        user_id: userId,
        email: input.email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

      await sendEmailOtp(input.email, otp, input.fullName);
      await this.logAuditEvent(userId, "signup", ipAddress, userAgent);

      return { userId, email: input.email };
    }

    const mockOtp = generateOtpCode(6);
    await sendEmailOtp(input.email, mockOtp, input.fullName);
    return { userId: `mock_${Date.now()}`, email: input.email, mockOtp };
  }

  static async getProfileByEmail(email: string) {
    const adminSupabase = createSupabaseAdminClient();
    if (adminSupabase) {
      const { data } = await adminSupabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();
      if (data) return data;
    }
    return null;
  }

  static async verifyEmail(email: string, code: string, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: latest } = await (supabase.from("email_verifications") as any)
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latest) {
        throw new Error("No active verification code found for this email.");
      }

      if (new Date(latest.expires_at) < new Date()) {
        throw new Error("Verification code has expired. Please request a new OTP.");
      }

      const isValid = verifyOtpCode(code, latest.code_hash);
      if (!isValid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("email_verifications") as any)
          .update({ attempts: latest.attempts + 1 })
          .eq("id", latest.id);
        throw new Error("Invalid verification code. Please check and try again.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("id")
        .eq("email", email)
        .single();

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({ email_verified: true })
          .eq("id", profile.id);

        await this.logAuditEvent(profile.id, "email_verification", ipAddress, userAgent);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("email_verifications") as any).delete().eq("id", latest.id);

      return { success: true };
    }

    return { success: true };
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
   * Pipeline: Authenticate -> Load profile -> Verify profile exists & role -> Sync Auth metadata -> Verify status -> Determine onboarding -> Redirect
   */
  static async loginUser(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const dbClient = supabaseAdmin || supabase;

    if (dbClient) {
      try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileQuery = await (dbClient.from("profiles") as any)
        .select("*")
        .eq("email", input.email)
        .single();
      let profile = profileQuery.data;
      if (profileQuery.error && isBackendUnavailableError(profileQuery.error)) {
        throw new Error("Authentication service is unreachable. Please try again shortly.");
      }

      if (!profile) {
        const { data: authData, error: listError } = await dbClient.auth.admin.listUsers();
        if (listError && isBackendUnavailableError(listError)) {
          throw new Error("Authentication service is unreachable. Please try again shortly.");
        }
        const authUser = authData?.users?.find((u) => u.email?.toLowerCase() === input.email.toLowerCase());
        
        if (authUser) {
          const userRole = authUser.user_metadata?.role;
          if (!userRole) {
            throw new Error("Unable to resolve user role. Account profile corrupted.");
          }
          const newProfile = {
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || input.email.split("@")[0],
            email: input.email,
            role: userRole,
            pin_hash: formatStoredPin(input.pin),
            email_verified: true,
            phone_verified: true,
            onboarding_completed: userRole === "admin" || userRole === "staff",
            first_login_completed: true,
            status: "active",
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (dbClient.from("profiles") as any).insert(newProfile);
          profile = newProfile;
        } else {
          await this.logAuditEvent(null, "failed_login", ipAddress, userAgent, { email: input.email });
          throw new Error("Invalid credentials. Please verify your email and PIN.");
        }
      }

      if (!profile.role) {
        throw new Error("User profile role is missing. Please contact platform support.");
      }

      // Synchronize Supabase Auth metadata with DB profile role
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.updateUserById(profile.id, {
          app_metadata: { roles: [profile.role] },
          user_metadata: { role: profile.role },
        });
      }

      const isPinValid = verifyStoredPin(input.pin, profile.pin_hash);
      if (!isPinValid) {
        await this.logAuditEvent(profile.id, "failed_login", ipAddress, userAgent);
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      if (profile.status && profile.status !== "active") {
        throw new Error(
          `Your account is currently inactive or suspended. Please contact support on WhatsApp at ${APP_CONFIG.supportWhatsApp.display}.`,
        );
      }

      if (!profile.email_verified) {
        return { requiresEmailVerification: true, email: profile.email };
      }

      if (supabase) {
        await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.pin + "_ZOLANZO_SECURE_KEY",
        });
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
        throw err;
      }
    }

    throw new Error("Database service client unavailable.");
  }

  static async requestPinReset(email: string, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();
    const otp = generateOtpCode(6);

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("id, full_name")
        .eq("email", email)
        .single();

      if (profile) {
        const codeHash = hashOtpCode(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("email_verifications") as any).insert({
          user_id: profile.id,
          email,
          code_hash: codeHash,
          expires_at: expiresAt,
        });

        await sendPinResetEmail(email, otp, profile.full_name);
        await this.logAuditEvent(profile.id, "pin_reset_requested", ipAddress, userAgent);
      }
    } else {
      await sendPinResetEmail(email, otp);
    }

    return { success: true };
  }

  static async resetPin(email: string, code: string, newPin: string, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: latest } = await (supabase.from("email_verifications") as any)
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!latest) {
        throw new Error("No active PIN reset request found.");
      }

      if (new Date(latest.expires_at) < new Date()) {
        throw new Error("PIN reset OTP code has expired.");
      }

      const isValid = verifyOtpCode(code, latest.code_hash);
      if (!isValid) {
        throw new Error("Invalid PIN reset code.");
      }

      const newPinHash = formatStoredPin(newPin);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("id")
        .eq("email", email)
        .single();

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({ pin_hash: newPinHash, must_change_pin: false })
          .eq("id", profile.id);

        await this.logAuditEvent(profile.id, "pin_reset_completed", ipAddress, userAgent);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("email_verifications") as any).delete().eq("id", latest.id);

      return { success: true };
    }

    return { success: true };
  }

  static async logAuditEvent(
    userId: string | null,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ) {
    const supabaseAdmin = createSupabaseAdminClient();
    if (supabaseAdmin) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin.from("audit_logs") as any).insert({
        user_id: userId,
        action,
        ip_address: ipAddress || "127.0.0.1",
        user_agent: userAgent || "",
        metadata: metadata || {},
      });
    }
  }
}
