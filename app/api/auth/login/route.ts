import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const body = await request.json();
    const { email, pin, rememberMe } = body;

    if (!email || !pin) {
      return NextResponse.json(
        { error: "Email address and 6-digit PIN are required." },
        { status: 400 }
      );
    }

    // Rate Limiting: Max 5 failed login attempts per email per 15 minutes
    const rateLimit = checkRateLimit(`login_${email}_${ip}`, 5, 900);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const result = await AuthService.loginUser({ email, pin, rememberMe }, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: "Authenticated successfully.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid credentials.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
