import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and 6-digit verification code are required." },
        { status: 400 }
      );
    }

    // Rate limiting: max 5 OTP verifications per IP per 5 minutes
    const rateLimit = checkRateLimit(`verify_email_${email}_${ip}`, 5, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many verification attempts. Please try again in ${rateLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const result = await AuthService.verifyEmail(email, code, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: "Email address verified successfully.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
