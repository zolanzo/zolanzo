import type { PaymentProviderAdapter } from "@/lib/integrations/types";
import { createStubAdapter } from "@/lib/integrations/payments/stub-factory";

export const paystackPaymentAdapter: PaymentProviderAdapter = createStubAdapter({
  providerKey: "paystack",
  capabilities: [
    "accepts_payments",
    "bank_transfers",
    "refunds",
    "webhooks",
    "multi_currency",
    "payouts",
    "virtual_accounts",
  ],
});
