/**
 * Payment adapter registry — select by key or required capabilities.
 */

import type {
  PaymentCapability,
  PaymentProviderAdapter,
} from "@/lib/integrations/types";
import { adapterHasCapabilities } from "@/lib/integrations/payments/stub-factory";
import { memoryPaymentAdapter } from "@/lib/integrations/payments/memory-adapter";
import { paystackPaymentAdapter } from "@/lib/integrations/payments/paystack-adapter";
import { flutterwavePaymentAdapter } from "@/lib/integrations/payments/flutterwave-adapter";
import { stripePaymentAdapter } from "@/lib/integrations/payments/stripe-adapter";
import { monnifyPaymentAdapter } from "@/lib/integrations/payments/monnify-adapter";
import { integrationRegistry } from "@/lib/integrations/registry";

const BUILTIN: PaymentProviderAdapter[] = [
  memoryPaymentAdapter,
  paystackPaymentAdapter,
  flutterwavePaymentAdapter,
  stripePaymentAdapter,
  monnifyPaymentAdapter,
];

export function listPaymentAdapters(): PaymentProviderAdapter[] {
  const fromRegistry = integrationRegistry.payments ?? [];
  const keys = new Set(fromRegistry.map((a) => a.providerKey));
  return [
    ...fromRegistry,
    ...BUILTIN.filter((a) => !keys.has(a.providerKey)),
  ];
}

export function getPaymentAdapter(
  providerKey: string,
): PaymentProviderAdapter | null {
  return listPaymentAdapters().find((a) => a.providerKey === providerKey) ?? null;
}

export function selectPaymentAdapter(params: {
  providerKey?: string;
  requiredCapabilities?: readonly PaymentCapability[];
}): PaymentProviderAdapter {
  if (params.providerKey) {
    const found = getPaymentAdapter(params.providerKey);
    if (!found) {
      throw new Error(`Unknown payment provider: ${params.providerKey}`);
    }
    if (
      params.requiredCapabilities &&
      !adapterHasCapabilities(found, params.requiredCapabilities)
    ) {
      throw new Error(
        `Provider ${params.providerKey} missing required capabilities`,
      );
    }
    return found;
  }

  const required = params.requiredCapabilities ?? ["accepts_payments", "webhooks"];
  const match = listPaymentAdapters().find((a) =>
    adapterHasCapabilities(a, required),
  );
  if (!match) {
    throw new Error("No payment adapter matches required capabilities");
  }
  return match;
}

export {
  memoryPaymentAdapter,
  paystackPaymentAdapter,
  flutterwavePaymentAdapter,
  stripePaymentAdapter,
  monnifyPaymentAdapter,
};
