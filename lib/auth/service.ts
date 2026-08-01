import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatStoredPin, verifyStoredPin } from "@/lib/security/hash";
import { generateOtpCode, hashOtpCode, verifyOtpCode } from "@/lib/otp/generator";
import { sendEmailOtp, sendPinResetEmail } from "@/lib/email/resend";
import { sendSmsOtp } from "@/lib/sms/provider";

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
  /**
   * Helper to generate unique referral code (e.g. ZOL8492X)
   */
  static generateReferralCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "ZOL";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Register new user account & send email OTP
   */
  static async registerUser(input: SignupInput, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();
    const pinHash = formatStoredPin(input.pin);
    const userReferralCode = this.generateReferralCode();

    if (supabase) {
      // 1. Create user in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.pin + "_ZOLANZO_SECURE_KEY",
        options: {
          data: {
            full_name: input.fullName,
            referral_code: userReferralCode,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error("Failed to register account.");
      }

      // 2. Validate referral code if supplied
      let referrerId: string | null = null;
      if (input.referralCode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: refUser } = await (supabase.from("profiles") as any)
          .select("id")
          .eq("referral_code", input.referralCode.trim().toUpperCase())
          .single();
        if (refUser && refUser.id !== userId) {
          referrerId = refUser.id;
        }
      }

      // 3. Create Profile record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any).insert({
        id: userId,
        full_name: input.fullName,
        email: input.email,
        role: input.role || "worker",
        pin_hash: pinHash,
        email_verified: false,
        phone_verified: false,
        referral_code: userReferralCode,
        referred_by: referrerId,
        status: "active",
      });

      // 4. Create Referral relationship if present
      if (referrerId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("referrals") as any).insert({
          referrer_id: referrerId,
          referred_id: userId,
          referral_code: input.referralCode!.trim().toUpperCase(),
        });
      }

      // 5. Generate 6-digit Email OTP & send via Resend
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

      // Audit Log
      await this.logAuditEvent(userId, "signup", ipAddress, userAgent);

      return { userId, email: input.email };
    }

    // Dev/Mock fallback
    const mockOtp = generateOtpCode(6);
    await sendEmailOtp(input.email, mockOtp, input.fullName);
    return { userId: `mock_${Date.now()}`, email: input.email, mockOtp };
  }

  /**
   * Verify Email OTP
   */
  static async verifyEmail(email: string, code: string, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("id, full_name")
        .eq("email", email)
        .single();

      if (!profile) {
        throw new Error("Invalid verification request.");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: verifications } = await (supabase.from("email_verifications") as any)
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latest = verifications?.[0];
      if (!latest) {
        throw new Error("No active verification code found.");
      }

      if (new Date() > new Date(latest.expires_at)) {
        throw new Error("Verification code has expired. Please request a new code.");
      }

      if (latest.attempts >= 5) {
        throw new Error("Maximum attempts exceeded. Please request a new code.");
      }

      const isValid = verifyOtpCode(code, latest.code_hash);
      if (!isValid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("email_verifications") as any)
          .update({ attempts: latest.attempts + 1 })
          .eq("id", latest.id);
        throw new Error("Invalid verification code. Please check and try again.");
      }

      // Mark email as verified
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .update({ email_verified: true })
        .eq("id", profile.id);

      // Clean up verification record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("email_verifications") as any).delete().eq("id", latest.id);

      // Audit Log
      await this.logAuditEvent(profile.id, "email_verification", ipAddress, userAgent);

      return { success: true };
    }

    return { success: true };
  }

  /**
   * Authenticate user via Email + 6-digit PIN
   */
  static async loginUser(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("*")
        .eq("email", input.email)
        .single();

      if (!profile) {
        await this.logAuditEvent(null, "failed_login", ipAddress, userAgent, { email: input.email });
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      const isPinValid = verifyStoredPin(input.pin, profile.pin_hash);
      if (!isPinValid) {
        await this.logAuditEvent(profile.id, "failed_login", ipAddress, userAgent);
        throw new Error("Invalid credentials. Please verify your email and PIN.");
      }

      if (!profile.email_verified) {
        return { requiresEmailVerification: true, email: profile.email };
      }

      // Sign in via Supabase Auth session
      await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.pin + "_ZOLANZO_SECURE_KEY",
      });

      await this.logAuditEvent(profile.id, "login", ipAddress, userAgent);

      return { success: true, profile };
    }

    return { success: true, mockUser: true };
  }

  /**
   * Request PIN Reset OTP
   */
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

  /**
   * Reset 6-Digit PIN
   */
  static async resetPin(email: string, newPin: string, ipAddress?: string, userAgent?: string) {
    const supabase = await createSupabaseServerClient();
    const newPinHash = formatStoredPin(newPin);

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("id")
        .eq("email", email)
        .single();

      if (profile) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({ pin_hash: newPinHash })
          .eq("id", profile.id);

        await this.logAuditEvent(profile.id, "pin_reset", ipAddress, userAgent);
      }
    }

    return { success: true };
  }

  /**
   * Send Phone Verification SMS OTP
   */
  static async sendPhoneOtp(userId: string, phone: string) {
    const otp = generateOtpCode(6);
    await sendSmsOtp({
      to: phone,
      message: `${otp} is your ZOLANZO security verification code.`,
    });
    return { success: true };
  }

  /**
   * Log Audit Event
   */
  static async logAuditEvent(
    userId: string | null,
    eventType: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("auth_audit_logs") as any).insert({
          user_id: userId,
          event_type: eventType,
          ip_address: ipAddress || "127.0.0.1",
          user_agent: userAgent || "Unknown Browser",
          metadata: metadata || {},
        });
      }
    } catch {
      // Audit log silent failure prevention
    }
  }
}
