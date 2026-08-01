import { NextResponse, type NextRequest } from "next/server";
import { AuthService } from "@/lib/auth/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, phone } = body;

    if (action === "send_otp") {
      if (!userId || !phone) {
        return NextResponse.json({ error: "User ID and phone number are required." }, { status: 400 });
      }
      const result = await AuthService.sendPhoneOtp(userId, phone);
      return NextResponse.json({ success: true, message: "SMS OTP sent.", data: result });
    }

    if (action === "verify_otp") {
      // Mock SMS OTP verification -> phone_verified = true
      return NextResponse.json({
        success: true,
        message: "Phone number verified successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Phone verification failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
