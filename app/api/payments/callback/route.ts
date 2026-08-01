/**
 * Payment browser callback / return URL.
 * Validates reference + amount + currency + status via provider verify.
 * NEVER posts ledger journals — webhooks own money movement.
 */

import { NextResponse } from "next/server";
import { validatePaymentCallback } from "@/features/payments/services/refunds";
import { getEnv } from "@/lib/validation/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function appBaseUrl(): string {
  try {
    return getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  } catch {
    return (
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000"
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference =
    url.searchParams.get("reference") ??
    url.searchParams.get("trxref") ??
    "";

  if (!reference) {
    const dest = new URL("/app", appBaseUrl());
    dest.searchParams.set("payment", "missing_reference");
    return NextResponse.redirect(dest);
  }

  const validation = await validatePaymentCallback({ reference });

  const dest = new URL("/app", appBaseUrl());
  dest.searchParams.set("payment", validation.verified ? "success" : "pending");
  if (validation.paymentPublicId) {
    dest.searchParams.set("paymentId", validation.paymentPublicId);
  }
  dest.searchParams.set("verified", String(validation.verified));
  dest.searchParams.set("status", validation.status);
  dest.searchParams.set(
    "amountOk",
    String(validation.amountMatches && validation.currencyMatches),
  );

  return NextResponse.redirect(dest);
}
