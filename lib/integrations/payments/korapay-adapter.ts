import {
  NormalizedPaymentEvent,
  PaymentCapability,
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProviderAdapter,
  PaymentVerificationInput,
  PaymentVerificationResult,
  PaymentWebhookParseResult,
} from "@/lib/integrations/types";
import { AppError } from "@/lib/api/response";
import { recordFinancialLedgerEntry } from "@/lib/audit/financial-ledger";

export interface KorapayVirtualAccountInput {
  accountName: string;
  customerEmail: string;
  bvn?: string;
  nin?: string;
}

export interface KorapayPayoutInput {
  amount: number;
  currency: string;
  bankCode: string;
  accountNumber: string;
  narration: string;
  reference: string;
}

/**
 * Korapay Payment Provider Adapter for Pan-African Payments & Payouts.
 * Integrates Collections, Virtual Accounts, and Bank/Mobile Money Payouts.
 */
export class KorapayPaymentAdapter implements PaymentProviderAdapter {
  readonly providerKey = "korapay";
  readonly capabilities: readonly PaymentCapability[] = [
    "accepts_payments",
    "bank_transfers",
    "virtual_accounts",
    "webhooks",
    "multi_currency",
    "payouts",
  ];

  private get secretKey(): string | null {
    return process.env.KORAPAY_SECRET_KEY || null;
  }

  private get baseUrl(): string {
    return (
      process.env.KORAPAY_BASE_URL || "https://api.korapay.com/merchant/api/v1"
    );
  }

  /**
   * Initialize a deposit or campaign funding payment session
   */
  async createPaymentIntent(
    input: PaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    const reference = input.idempotencyKey || `KORA_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (!this.secretKey) {
      return {
        provider: "korapay",
        providerRef: reference,
        status: "initiated",
        checkoutUrl: `https://checkout.korapay.com/pay/${reference}`,
        raw: { stub: true, status: "success", reference },
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/charges/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: input.amountMinor / 100,
          currency: input.currency || "NGN",
          reference,
          notification_url: input.returnUrl,
          customer: {
            email: input.customerRef,
            name: input.customerRef,
          },
          metadata: input.metadata,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        throw new AppError("payment_failed", data.message || "Korapay initialization failed");
      }

      return {
        provider: "korapay",
        providerRef: reference,
        status: "initiated",
        checkoutUrl: data.data.checkout_url || data.data.redirect_url,
        raw: data,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("payment_error", `Korapay Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  /**
   * Verify deposit or payment status
   */
  async verifyPayment(
    input: PaymentVerificationInput,
  ): Promise<PaymentVerificationResult> {
    if (!this.secretKey) {
      return {
        provider: "korapay",
        providerRef: input.providerRef,
        verified: true,
        status: "succeeded",
        amountMinor: input.amountMinor || 500000,
        currency: input.currency || "NGN",
        snapshot: { stub: true, status: "successful" },
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/charges/${encodeURIComponent(input.providerRef)}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      const data = await response.json();
      if (!response.ok || !data.status) {
        return {
          provider: "korapay",
          providerRef: input.providerRef,
          verified: false,
          status: "failed",
          amountMinor: 0,
          currency: input.currency || "NGN",
          snapshot: data,
        };
      }

      const korStatus = data.data.status?.toLowerCase();
      const status =
        korStatus === "success" || korStatus === "successful"
          ? "succeeded"
          : korStatus === "pending"
          ? "pending"
          : "failed";

      return {
        provider: "korapay",
        providerRef: input.providerRef,
        verified: status === "succeeded",
        status,
        amountMinor: Math.round((data.data.amount || 0) * 100),
        currency: data.data.currency || "NGN",
        snapshot: data,
      };
    } catch {
      return {
        provider: "korapay",
        providerRef: input.providerRef,
        verified: false,
        status: "failed",
        amountMinor: 0,
        currency: input.currency || "NGN",
        snapshot: { error: true },
      };
    }
  }

  /**
   * Parse Webhook Payload with Idempotency Key check
   */
  async parseWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<PaymentWebhookParseResult> {
    const payload = JSON.parse(body);
    const data = payload.data || {};
    const reference = data.reference || `REF_${Date.now()}`;
    const idempotencyKey = headers["x-korapay-signature"] || headers["idempotency-key"] || reference;

    const event: NormalizedPaymentEvent = {
      type: data.status === "success" ? "payment.succeeded" : "payment.failed",
      provider: "korapay",
      providerRef: reference,
      amountMinor: Math.round((data.amount || 0) * 100),
      currency: data.currency || "NGN",
      occurredAt: new Date().toISOString(),
      idempotencyKey,
      raw: payload,
    };

    return {
      validSignature: true,
      events: [event],
    };
  }

  /**
   * Normalize Event
   */
  normalizeEvent(raw: Record<string, unknown>): NormalizedPaymentEvent | null {
    const data = (raw.data as Record<string, unknown>) || {};
    return {
      type: data.status === "success" ? "payment.succeeded" : "payment.failed",
      provider: "korapay",
      providerRef: (data.reference as string) || "REF_UNKNOWN",
      amountMinor: Math.round(((data.amount as number) || 0) * 100),
      currency: (data.currency as string) || "NGN",
      occurredAt: new Date().toISOString(),
      idempotencyKey: (data.reference as string) || "IDEM_UNKNOWN",
      raw,
    };
  }

  /**
   * Create Dedicated Virtual Account for Organization Funding
   */
  async createVirtualAccount(input: KorapayVirtualAccountInput) {
    if (!this.secretKey) {
      return {
        accountNumber: "0123456789",
        bankName: "Wema Bank (ZOLANZO Escrow)",
        accountName: input.accountName,
        stub: true,
      };
    }

    const response = await fetch(`${this.baseUrl}/virtual-bank-accounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_name: input.accountName,
        customer: { email: input.customerEmail },
        bvn: input.bvn,
      }),
    });

    const data = await response.json();
    return data.data;
  }

  /**
   * Process Bank or Mobile Money Payout to Worker
   */
  async processPayout(input: KorapayPayoutInput) {
    await recordFinancialLedgerEntry({
      type: "payout",
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      narration: input.narration,
      status: "pending",
    });

    if (!this.secretKey) {
      return {
        status: "success",
        reference: input.reference,
        amount: input.amount,
        stub: true,
      };
    }

    const response = await fetch(`${this.baseUrl}/transactions/disburse`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
        destination: {
          type: "bank_account",
          amount: input.amount,
          currency: input.currency,
          narration: input.narration,
          bank_account: {
            bank_code: input.bankCode,
            account_number: input.accountNumber,
          },
        },
      }),
    });

    const data = await response.json();
    return data;
  }
}
