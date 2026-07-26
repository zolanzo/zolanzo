import type { PaymentProviderAdapter } from "@/lib/integrations/types";
import { createStubAdapter } from "@/lib/integrations/payments/stub-factory";

export const stripePaymentAdapter: PaymentProviderAdapter = createStubAdapter({
  providerKey: "stripe",
  capabilities: [
    "accepts_payments",
    "refunds",
    "split_payments",
    "recurring_billing",
    "webhooks",
    "multi_currency",
    "payouts",
  ],
});
