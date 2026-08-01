import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    const body = await request.json();
    const { email, newPin } = body;

    if (!email || !newPin) {
      return NextResponse.json({ error: "Email and new 6-digit PIN are required." }, { status: 400 });
    }

    if (!/^\d{6}$/.test(newPin)) {
      return NextResponse.json({ error: "PIN must consist of exactly 6 numeric digits." }, { status: 400 });
    }

    const result = await AuthService.resetPin(email, newPin, ip, userAgent);

    return NextResponse.json({
      success: true,
      message: "Security PIN reset successfully.",
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PIN reset failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
