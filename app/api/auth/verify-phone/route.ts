import { NextResponse, type NextRequest } from "next/server";
import { AppError } from "@/lib/api/response";
import { getAuthContext, getRequestIp } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  confirmPhoneOtp,
  PHONE_OTP_USER_MESSAGES,
  requestPhoneOtp,
} from "@/features/authentication/services/phone-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userFacingError(error: unknown): { body: { error: string }; status: number } {
  if (error instanceof AppError) {
    return { body: { error: error.message }, status: error.status };
  }
  return {
    body: { error: PHONE_OTP_USER_MESSAGES.sendFailed },
    status: 400,
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = await getRequestIp();
    const rate = checkRateLimit(`verify_phone_${ip ?? "unknown"}`, 8, 300);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: PHONE_OTP_USER_MESSAGES.rateLimited },
        { status: 429 },
      );
    }

    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json(
        { error: PHONE_OTP_USER_MESSAGES.unauthenticated },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      action?: string;
      phone?: string;
      code?: string;
    };
    const action = body.action;
    const phone = typeof body.phone === "string" ? body.phone : "";

    if (action === "send_otp") {
      const result = await requestPhoneOtp({ ctx, phone, ip });
      if ("alreadyVerified" in result) {
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          message: PHONE_OTP_USER_MESSAGES.alreadyVerified,
        });
      }
      return NextResponse.json({
        success: true,
        message: "Verification code sent.",
      });
    }

    if (action === "verify_otp") {
      const code = typeof body.code === "string" ? body.code : "";
      await confirmPhoneOtp({ ctx, phone, code, ip });
      return NextResponse.json({
        success: true,
        verified: true,
        message: PHONE_OTP_USER_MESSAGES.alreadyVerified,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    const mapped = userFacingError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
