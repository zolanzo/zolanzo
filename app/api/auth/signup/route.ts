import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeEmail } from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const body = await request.json();
    const { role, fullName, email, pin, referralCode } = body;

    if (!fullName || !email || !pin) {
      return NextResponse.json(
        { error: "Full Name, Email Address, and 6-digit PIN are required." },
        { status: 400 }
      );
    }

    const ipLimit = checkRateLimit(`signup_${ip}`, 5, 600);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please try again in ${ipLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const emailLimit = checkRateLimit(`signup_email_${normalizeEmail(String(email))}`, 3, 600);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts for this email. Please try again in ${emailLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must consist of exactly 6 numeric digits." },
        { status: 400 }
      );
    }

    const result = await AuthService.registerUser(
      { role, fullName, email, pin, referralCode },
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Verification code sent to email.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
