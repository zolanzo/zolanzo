import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { EMAIL_OTP_PURPOSE, type EmailOtpPurpose } from "@/lib/auth/email-otp-constants";
import { normalizeEmail } from "@/lib/auth/email";

function parsePurpose(value: unknown): EmailOtpPurpose {
  return value === EMAIL_OTP_PURPOSE.pinReset
    ? EMAIL_OTP_PURPOSE.pinReset
    : EMAIL_OTP_PURPOSE.emailVerification;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";
    const body = await request.json();
    const { email, purpose: rawPurpose } = body;
    const purpose = parsePurpose(rawPurpose);

    if (!email) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`resend_otp_${normalizeEmail(String(email))}_${ip}`, 3, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many resend requests. Please try again in ${rateLimit.resetSeconds} seconds.` },
        { status: 429 },
      );
    }

    const result = await AuthService.resendEmailVerification(email, ip, userAgent, purpose);
    return NextResponse.json({
      success: true,
      message: "A new verification code has been sent.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not resend the verification code.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
