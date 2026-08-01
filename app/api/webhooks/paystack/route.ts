/**
 * Paystack webhook ingress — signature verified inside adapter.
 * Ledger writes happen only via handlePaymentWebhook → verified events.
 */

import { NextResponse } from "next/server";
import { handlePaymentWebhook } from "@/features/payments/services/payment-platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const result = await handlePaymentWebhook({
    input: {
      providerKey: "paystack",
      headers,
      body,
    },
  });

  if (!result.ok) {
    const code = result.error.code;
    const status =
      code === "INVALID_SIGNATURE" ||
      code === "WEBHOOK_REPLAY" ||
      code === "WEBHOOK_SECRET_MISSING" ||
      code === "WEBHOOK_SIGNATURE_MISSING" ||
      code === "WEBHOOK_TIMESTAMP_SKEW"
        ? 401
        : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 200 });
}
