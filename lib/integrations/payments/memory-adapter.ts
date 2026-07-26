import type { PaymentProviderAdapter } from "@/lib/integrations/types";
import { createStubAdapter } from "@/lib/integrations/payments/stub-factory";

/** In-memory / test adapter — default for local and unit tests */
export const memoryPaymentAdapter: PaymentProviderAdapter = createStubAdapter({
  providerKey: "memory",
  capabilities: [
    "accepts_payments",
    "refunds",
    "webhooks",
    "multi_currency",
  ],
});
