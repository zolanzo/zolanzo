import type { PaymentProviderAdapter } from "@/lib/integrations/types";
import { createStubAdapter } from "@/lib/integrations/payments/stub-factory";

export const flutterwavePaymentAdapter: PaymentProviderAdapter =
  createStubAdapter({
    providerKey: "flutterwave",
    capabilities: [
      "accepts_payments",
      "bank_transfers",
      "refunds",
      "webhooks",
      "multi_currency",
      "payouts",
    ],
  });
