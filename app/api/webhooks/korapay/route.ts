import { NextRequest, NextResponse } from "next/server";
import { KorapayPaymentAdapter } from "@/lib/integrations/payments/korapay-adapter";
import { recordFinancialLedgerEntry } from "@/lib/audit/financial-ledger";

const processedWebhooks: Set<string> = new Set();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    const _signature = req.headers.get("x-korapay-signature");
    const adapter = new KorapayPaymentAdapter();

    const webhookResult = await adapter.parseWebhook(headersObj, rawBody);
    const event = webhookResult.events[0];

    if (!event) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Idempotency Check: Prevent duplicate credits/payouts
    const idempotencyKey = event.idempotencyKey || event.providerRef;
    if (processedWebhooks.has(idempotencyKey)) {
      return NextResponse.json({ status: "ignored", message: "Duplicate webhook event" }, { status: 200 });
    }

    processedWebhooks.add(idempotencyKey);

    // Audit Log Financial Transaction
    await recordFinancialLedgerEntry({
      type: event.type === "payment.succeeded" ? "deposit" : "payout",
      reference: event.providerRef,
      amount: event.amountMinor / 100,
      currency: event.currency,
      narration: `Korapay Webhook Event: ${event.type}`,
      status: "completed",
    });

    return NextResponse.json({
      status: "success",
      event: event.type,
      reference: event.providerRef,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook Error" },
      { status: 500 },
    );
  }
}
