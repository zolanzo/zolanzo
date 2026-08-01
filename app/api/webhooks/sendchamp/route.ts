/**
 * Sendchamp webhook ingress — SMS/WhatsApp delivery lifecycle.
 */

import { NextResponse } from "next/server";
import { handleSendchampWebhook } from "@/features/notifications/services/sendchamp-webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = await handleSendchampWebhook({ headers, body });
  if (!result.ok) {
    const code = result.error.code;
    const status =
      code === "INVALID_SIGNATURE" || code === "WEBHOOK_REPLAY" ? 401 : 400;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result, { status: 200 });
}
