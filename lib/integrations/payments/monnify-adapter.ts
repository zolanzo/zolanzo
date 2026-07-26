import type { PaymentProviderAdapter } from "@/lib/integrations/types";
import { createStubAdapter } from "@/lib/integrations/payments/stub-factory";

export const monnifyPaymentAdapter: PaymentProviderAdapter = createStubAdapter({
  providerKey: "monnify",
  capabilities: [
    "accepts_payments",
    "bank_transfers",
    "virtual_accounts",
    "webhooks",
    "payouts",
  ],
});
