/**
 * Resend webhook ingress — delivery / bounce / complaint / open.
 */

import { NextResponse } from "next/server";
import { handleResendWebhook } from "@/features/notifications/services/resend-webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = await handleResendWebhook({ headers, body });
  if (!result.ok) {
    const code = result.error.code;
    const status =
      code === "INVALID_SIGNATURE" ||
      code === "WEBHOOK_REPLAY" ||
      code === "WEBHOOK_SECRET_MISSING"
        ? 401
        : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 200 });
}
