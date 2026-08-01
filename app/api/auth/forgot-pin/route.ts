import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const rateLimit = checkRateLimit(`forgot_pin_${email}_${ip}`, 3, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many PIN reset requests. Please try again in ${rateLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const result = await AuthService.requestPinReset(email, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: "If an account exists, a 6-digit recovery code has been sent.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
